import path from "path";
import fs from "fs/promises";

const DATA_DIR = path.join(process.cwd(), "data");

export function getUploadDir() {
  return path.join(DATA_DIR, "uploads");
}

export function getKeyframesDir(projectId: string) {
  return path.join(DATA_DIR, "keyframes", projectId);
}

export function getClipsDir(projectId: string) {
  return path.join(DATA_DIR, "clips", projectId);
}

export function getExportsDir(projectId: string) {
  return path.join(DATA_DIR, "exports", projectId);
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
