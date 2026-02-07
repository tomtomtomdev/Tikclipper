import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function GET() {
  const allProjects = await db.select().from(schema.projects).orderBy(desc(schema.projects.createdAt));
  return NextResponse.json(allProjects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = uuid();

  await db.insert(schema.projects).values({
    id,
    name: body.name || "Untitled Project",
    status: "created",
  });

  const project = await db.select().from(schema.projects).where(eq(schema.projects.id, id));

  return NextResponse.json(project[0], { status: 201 });
}
