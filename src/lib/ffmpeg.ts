import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";

const DATA_DIR = path.join(process.cwd(), "data");

export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

export async function extractKeyframes(
  videoPath: string,
  projectId: string,
  intervalSeconds = 3
): Promise<string[]> {
  const outDir = path.join(DATA_DIR, "keyframes", projectId);
  await fs.mkdir(outDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([`-vf fps=1/${intervalSeconds}`, "-q:v 2"])
      .output(path.join(outDir, "frame_%04d.jpg"))
      .on("end", async () => {
        const files = await fs.readdir(outDir);
        const sorted = files.filter(f => f.endsWith(".jpg")).sort();
        resolve(sorted.map(f => path.join(outDir, f)));
      })
      .on("error", reject)
      .run();
  });
}

export async function extractAudio(videoPath: string, projectId: string): Promise<string> {
  const outPath = path.join(DATA_DIR, "keyframes", projectId, "audio.wav");
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions(["-vn", "-acodec pcm_s16le", "-ar 16000", "-ac 1"])
      .output(outPath)
      .on("end", () => resolve(outPath))
      .on("error", reject)
      .run();
  });
}

export async function cutClip(
  videoPath: string,
  projectId: string,
  clipId: string,
  startTime: number,
  endTime: number,
  format: "tiktok" | "reels" | "shorts" | "raw" = "tiktok"
): Promise<string> {
  const outDir = path.join(DATA_DIR, "clips", projectId);
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${clipId}.mp4`);

  const filters: string[] = [];
  if (format !== "raw") {
    // Smart crop to 9:16 - center crop
    filters.push("crop=ih*9/16:ih:(iw-ih*9/16)/2:0");
    filters.push("scale=1080:1920");
  }

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(videoPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .outputOptions(["-c:v libx264", "-c:a aac", "-preset fast"]);

    if (filters.length > 0) {
      cmd = cmd.outputOptions([`-vf ${filters.join(",")}`]);
    }

    cmd
      .output(outPath)
      .on("end", () => resolve(outPath))
      .on("error", reject)
      .run();
  });
}

export async function burnCaptions(
  videoPath: string,
  outputPath: string,
  caption: string
): Promise<string> {
  const escaped = caption.replace(/'/g, "\\'").replace(/:/g, "\\:");
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf drawtext=text='${escaped}':fontsize=42:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-th-100`,
        "-c:a copy",
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}
