import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = await db.select().from(schema.projects).where(eq(schema.projects.id, params.id));
  if (!project.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const projectClips = await db.select().from(schema.clips).where(eq(schema.clips.projectId, params.id));
  const links = await db.select().from(schema.productLinks).where(eq(schema.productLinks.projectId, params.id));

  return NextResponse.json({ ...project[0], clips: projectClips, productLinks: links });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  await db.update(schema.projects).set({ ...body, updatedAt: new Date() }).where(eq(schema.projects.id, params.id));
  const updated = await db.select().from(schema.projects).where(eq(schema.projects.id, params.id));
  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.delete(schema.projects).where(eq(schema.projects.id, params.id));
  return NextResponse.json({ ok: true });
}
