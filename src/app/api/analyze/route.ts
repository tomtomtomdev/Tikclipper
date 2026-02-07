import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { analysisQueue } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const { projectId } = await req.json();

  const project = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project.length) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!project[0].sourceVideoPath) return NextResponse.json({ error: "No video uploaded" }, { status: 400 });

  const job = await analysisQueue.add("analyze", {
    projectId,
    videoPath: project[0].sourceVideoPath,
    intervalSeconds: 3,
  });

  return NextResponse.json({ jobId: job.id, status: "queued" });
}
