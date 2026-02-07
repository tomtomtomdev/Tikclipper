import { Worker, Job, connection, AnalysisJobData } from "@/lib/queue";
import { extractKeyframes, extractAudio, getVideoDuration } from "@/lib/ffmpeg";
import { analyzeKeyframes, detectClips } from "@/lib/claude";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

async function processAnalysis(job: Job<AnalysisJobData>) {
  const { projectId, videoPath, intervalSeconds = 3 } = job.data;

  await job.updateProgress(5);
  await db.update(schema.projects).set({ status: "analyzing" }).where(eq(schema.projects.id, projectId));

  // 1. Get duration
  const duration = await getVideoDuration(videoPath);
  await db.update(schema.projects).set({ duration }).where(eq(schema.projects.id, projectId));
  await job.updateProgress(10);

  // 2. Extract keyframes
  const framePaths = await extractKeyframes(videoPath, projectId, intervalSeconds);
  await job.updateProgress(30);

  // 3. Extract audio (for future transcription)
  try {
    await extractAudio(videoPath, projectId);
  } catch (e) {
    console.warn("Audio extraction failed (video may not have audio):", e);
  }
  await job.updateProgress(40);

  // 4. Analyze keyframes with Claude Vision
  const sceneTimeline = await analyzeKeyframes(framePaths, intervalSeconds);
  await job.updateProgress(70);

  // 5. Store scene timeline
  await db.update(schema.projects).set({
    sceneTimeline: sceneTimeline as unknown as null,
    status: "analyzed",
    updatedAt: new Date(),
  }).where(eq(schema.projects.id, projectId));
  await job.updateProgress(80);

  // 6. Auto-detect clips
  const clipSuggestions = await detectClips(sceneTimeline, duration);
  await job.updateProgress(90);

  // 7. Store clip suggestions
  const { v4: uuid } = await import("uuid");
  for (const suggestion of clipSuggestions) {
    await db.insert(schema.clips).values({
      id: uuid(),
      projectId,
      startTime: suggestion.startTime,
      endTime: suggestion.endTime,
      description: suggestion.description,
      confidenceScore: suggestion.confidenceScore,
      caption: suggestion.suggestedCaption,
      status: "pending",
    });
  }

  await job.updateProgress(100);
  return { sceneCount: sceneTimeline.length, clipCount: clipSuggestions.length };
}

// Only start worker if this file is run directly or imported in worker context
export function startAnalysisWorker() {
  const worker = new Worker("video-analysis", processAnalysis, {
    connection,
    concurrency: 1,
  });

  worker.on("completed", (job) => {
    console.log(`Analysis job ${job.id} completed:`, job.returnvalue);
  });

  worker.on("failed", async (job, err) => {
    console.error(`Analysis job ${job?.id} failed:`, err);
    if (job) {
      await db.update(schema.projects).set({ status: "failed" }).where(eq(schema.projects.id, job.data.projectId));
    }
  });

  return worker;
}
