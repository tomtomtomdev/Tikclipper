import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { ensureDir, getExportsDir } from "@/lib/storage";
import archiver from "archiver";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const { projectId } = await req.json();

  const project = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const projectClips = await db.select().from(schema.clips)
    .where(eq(schema.clips.projectId, projectId));

  const doneClips = projectClips.filter(c => c.status === "done" && c.outputPath);
  if (!doneClips.length) return NextResponse.json({ error: "No completed clips" }, { status: 400 });

  const exportDir = await ensureDir(getExportsDir(projectId));
  const zipPath = path.join(exportDir, `${project[0].name || "export"}.zip`);

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 5 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);

    // Add clips
    for (const clip of doneClips) {
      archive.file(clip.outputPath!, { name: path.basename(clip.outputPath!) });
    }

    // Add metadata JSON
    const metadata = {
      project: project[0].name,
      exportedAt: new Date().toISOString(),
      clips: doneClips.map(c => ({
        filename: path.basename(c.outputPath!),
        startTime: c.startTime,
        endTime: c.endTime,
        description: c.description,
        caption: c.caption,
        hashtags: c.hashtags,
        cta: c.ctaText,
      })),
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });

    archive.finalize();
  });

  return NextResponse.json({ zipPath, clipCount: doneClips.length });
}
