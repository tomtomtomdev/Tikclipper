import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  await db.update(schema.clips).set(body).where(eq(schema.clips.id, params.id));
  const updated = await db.select().from(schema.clips).where(eq(schema.clips.id, params.id));
  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.delete(schema.clips).where(eq(schema.clips.id, params.id));
  return NextResponse.json({ ok: true });
}
