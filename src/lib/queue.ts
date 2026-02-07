import { Queue, Worker, Job } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Queues
export const analysisQueue = new Queue("video-analysis", { connection });
export const clipQueue = new Queue("clip-generation", { connection });

export type AnalysisJobData = {
  projectId: string;
  videoPath: string;
  intervalSeconds?: number;
};

export type ClipJobData = {
  projectId: string;
  clipId: string;
  videoPath: string;
  startTime: number;
  endTime: number;
  format: "tiktok" | "reels" | "shorts" | "raw";
  burnCaption?: string;
};

export { Worker, Job, connection };
