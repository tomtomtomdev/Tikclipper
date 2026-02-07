import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { generateCaptionAndHashtags } from "@/lib/claude";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { tone = "casual" } = await req.json();

  const clip = await db.select().from(schema.clips).where(eq(schema.clips.id, params.id));
  if (!clip.length) return NextResponse.json({ error: "Clip not found" }, { status: 404 });

  let productInfo: string | null = null;
  if (clip[0].productLinkId) {
    const link = await db.select().from(schema.productLinks).where(eq(schema.productLinks.id, clip[0].productLinkId));
    if (link.length) productInfo = `${link[0].title} - ${link[0].category}`;
  }

  const result = await generateCaptionAndHashtags(
    clip[0].description || "Product clip",
    productInfo,
    null,
    tone
  );

  await db.update(schema.clips).set({
    caption: result.caption,
    hashtags: result.hashtags as unknown as null,
    ctaText: result.cta,
  }).where(eq(schema.clips.id, params.id));

  return NextResponse.json(result);
}
