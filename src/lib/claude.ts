import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";

const anthropic = new Anthropic();

export interface SceneAnalysis {
  timestamp: number;
  description: string;
  products: string[];
  actions: string[];
  emotionalTone: string;
  clipWorthy: boolean;
  clipWorthyReason?: string;
}

export interface ClipSuggestion {
  startTime: number;
  endTime: number;
  description: string;
  confidenceScore: number;
  type: "product_showcase" | "unboxing" | "reaction" | "before_after" | "cta" | "other";
  suggestedCaption: string;
}

export async function analyzeKeyframes(
  framePaths: string[],
  intervalSeconds: number
): Promise<SceneAnalysis[]> {
  const results: SceneAnalysis[] = [];

  // Process in batches of 10 frames
  const batchSize = 10;
  for (let i = 0; i < framePaths.length; i += batchSize) {
    const batch = framePaths.slice(i, i + batchSize);
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    content.push({
      type: "text",
      text: `Analyze these ${batch.length} sequential video frames (${intervalSeconds}s apart, starting at ${i * intervalSeconds}s). For each frame, identify: products visible, actions happening, emotional tone, and whether this moment is "clip-worthy" for TikTok/short-form content. Respond as JSON array.`,
    });

    for (const framePath of batch) {
      const imageData = await fs.readFile(framePath);
      const rawExt = path.extname(framePath).slice(1);
      const mediaType = rawExt === "jpg" ? "image/jpeg" : `image/${rawExt}` as `image/${string}`;
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: imageData.toString("base64"),
        },
      } as Anthropic.ImageBlockParam);
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [{ role: "user", content }],
      system: "You are a video analysis AI. Respond ONLY with a JSON array of scene analyses. Each element: {timestamp: number, description: string, products: string[], actions: string[], emotionalTone: string, clipWorthy: boolean, clipWorthyReason?: string}",
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      const parsed = JSON.parse(text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      results.push(...parsed);
    } catch {
      console.error("Failed to parse Claude response:", text.slice(0, 200));
    }
  }

  return results;
}

export async function detectClips(
  sceneTimeline: SceneAnalysis[],
  videoDuration: number
): Promise<ClipSuggestion[]> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Given this scene timeline from a product review/unboxing video (${videoDuration}s long), identify the best clip-worthy moments for TikTok. Each clip should be 15-60 seconds. Group related scenes into clips.\n\nTimeline:\n${JSON.stringify(sceneTimeline, null, 2)}\n\nRespond as JSON array of clip suggestions.`,
      },
    ],
    system: "You are a TikTok content strategist AI. Identify the best short-form clip opportunities. Respond ONLY with a JSON array: [{startTime, endTime, description, confidenceScore (0-1), type, suggestedCaption}]",
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
  } catch {
    return [];
  }
}

export async function generateCaptionAndHashtags(
  clipDescription: string,
  productInfo: string | null,
  transcript: string | null,
  tone: "casual" | "professional" | "hype" | "educational" = "casual"
): Promise<{ caption: string; hashtags: string[]; cta: string }> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a TikTok caption, hashtags, and CTA for this clip:\n\nClip: ${clipDescription}\n${productInfo ? `Product: ${productInfo}` : ""}\n${transcript ? `Transcript: ${transcript}` : ""}\nTone: ${tone}\n\nRespond as JSON: {caption: string, hashtags: string[], cta: string}. Include {{LINK}} placeholder in caption for affiliate link. Generate 15-20 hashtags.`,
      },
    ],
    system: "You are a social media expert specializing in Shopee affiliate marketing on TikTok. Respond ONLY with valid JSON.",
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
  } catch {
    return { caption: clipDescription, hashtags: ["#shopee", "#affiliate", "#tiktok"], cta: "Link in bio!" };
  }
}

export async function matchProductToScenes(
  productTitle: string,
  productCategory: string | null,
  sceneTimeline: SceneAnalysis[]
): Promise<Array<{ startTime: number; endTime: number; confidence: number }>> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Match this product to scenes where it appears in the video:\n\nProduct: ${productTitle}${productCategory ? ` (${productCategory})` : ""}\n\nScenes:\n${JSON.stringify(sceneTimeline, null, 2)}\n\nRespond as JSON array of timestamp ranges where this product appears: [{startTime, endTime, confidence}]`,
      },
    ],
    system: "You are a product matching AI. Respond ONLY with valid JSON array.",
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
  } catch {
    return [];
  }
}
