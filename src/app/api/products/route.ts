import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { matchProductToScenes } from "@/lib/claude";
import { v4 as uuid } from "uuid";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const links = await db.select().from(schema.productLinks).where(eq(schema.productLinks.projectId, projectId));
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const { projectId, url, title, image, category } = await req.json();

  const project = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
  if (!project.length) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const id = uuid();
  let matchedScenes: unknown = null;

  // If project has scene timeline, auto-match
  if (project[0].sceneTimeline && title) {
    const timeline = project[0].sceneTimeline as unknown[];
    matchedScenes = await matchProductToScenes(title, category || null, timeline as never);
  }

  await db.insert(schema.productLinks).values({
    id,
    projectId,
    url,
    title,
    image,
    category,
    matchedScenes: matchedScenes as null,
  });

  const link = await db.select().from(schema.productLinks).where(eq(schema.productLinks.id, id));
  return NextResponse.json(link[0], { status: 201 });
}
