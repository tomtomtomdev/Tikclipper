import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { ensureDir, getUploadDir } from "@/lib/storage";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("video") as File;
  const projectId = formData.get("projectId") as string;

  if (!file || !projectId) {
    return NextResponse.json({ error: "Missing video or projectId" }, { status: 400 });
  }

  const uploadDir = await ensureDir(getUploadDir());
  const ext = path.extname(file.name) || ".mp4";
  const filename = `${projectId}${ext}`;
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  await db.update(schema.projects).set({
    sourceVideoPath: filePath,
    sourceVideoName: file.name,
    status: "uploading",
    updatedAt: new Date(),
  }).where(eq(schema.projects.id, projectId));

  return NextResponse.json({ path: filePath, size: buffer.length });
}
