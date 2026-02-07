import { Worker, Job, connection, ClipJobData } from "@/lib/queue";
import { cutClip, burnCaptions } from "@/lib/ffmpeg";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

async function processClip(job: Job<ClipJobData>) {
  const { projectId, clipId, videoPath, startTime, endTime, format, burnCaption } = job.data;

  await db.update(schema.clips).set({ status: "processing" }).where(eq(schema.clips.id, clipId));
  await job.updateProgress(10);

  // Cut clip
  let outputPath = await cutClip(videoPath, projectId, clipId, startTime, endTime, format);
  await job.updateProgress(70);

  // Optionally burn captions
  if (burnCaption) {
    const captionedPath = outputPath.replace(".mp4", "_captioned.mp4");
    await burnCaptions(outputPath, captionedPath, burnCaption);
    outputPath = captionedPath;
  }
  await job.updateProgress(90);

  // Update DB
  await db.update(schema.clips).set({
    outputPath,
    format,
    status: "done",
  }).where(eq(schema.clips.id, clipId));

  await job.updateProgress(100);
  return { outputPath };
}

export function startClipWorker() {
  const worker = new Worker("clip-generation", processClip, {
    connection,
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    console.log(`Clip job ${job.id} completed:`, job.returnvalue);
  });

  worker.on("failed", async (job, err) => {
    console.error(`Clip job ${job?.id} failed:`, err);
    if (job) {
      await db.update(schema.clips).set({ status: "failed" }).where(eq(schema.clips.id, job.data.clipId));
    }
  });

  return worker;
}
