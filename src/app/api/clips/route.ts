import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { clipQueue } from "@/lib/queue";
import { v4 as uuid } from "uuid";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const projectClips = await db.select().from(schema.clips).where(eq(schema.clips.projectId, projectId));
  return NextResponse.json(projectClips);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, startTime, endTime, format = "tiktok", description, burnCaption } = body;

  const project = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project.length || !project[0].sourceVideoPath) {
    return NextResponse.json({ error: "Project or video not found" }, { status: 404 });
  }

  const clipId = uuid();
  await db.insert(schema.clips).values({
    id: clipId,
    projectId,
    startTime,
    endTime,
    description,
    format,
    status: "pending",
  });

  // Queue clip generation
  const job = await clipQueue.add("cut-clip", {
    projectId,
    clipId,
    videoPath: project[0].sourceVideoPath,
    startTime,
    endTime,
    format,
    burnCaption,
  });

  return NextResponse.json({ clipId, jobId: job.id, status: "queued" }, { status: 201 });
}

// Generate all pending clips for a project
export async function PUT(req: NextRequest) {
  const { projectId, format = "tiktok" } = await req.json();

  const project = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project.length || !project[0].sourceVideoPath) {
    return NextResponse.json({ error: "Project or video not found" }, { status: 404 });
  }

  const pendingClips = await db.select().from(schema.clips)
    .where(eq(schema.clips.projectId, projectId));

  const jobs = [];
  for (const clip of pendingClips.filter(c => c.status === "pending")) {
    const job = await clipQueue.add("cut-clip", {
      projectId,
      clipId: clip.id,
      videoPath: project[0].sourceVideoPath,
      startTime: clip.startTime,
      endTime: clip.endTime,
      format,
    });
    jobs.push({ clipId: clip.id, jobId: job.id });
  }

  return NextResponse.json({ queued: jobs.length, jobs });
}
