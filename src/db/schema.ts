import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sourceVideoPath: text("source_video_path"),
  sourceVideoName: text("source_video_name"),
  duration: real("duration"),
  sceneTimeline: text("scene_timeline", { mode: "json" }),
  status: text("status", { enum: ["created", "uploading", "analyzing", "analyzed", "generating", "done", "failed"] }).default("created"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const productLinks = sqliteTable("product_links", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  image: text("image"),
  category: text("category"),
  matchedScenes: text("matched_scenes", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const clips = sqliteTable("clips", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  description: text("description"),
  confidenceScore: real("confidence_score"),
  outputPath: text("output_path"),
  format: text("format", { enum: ["tiktok", "reels", "shorts", "raw"] }).default("tiktok"),
  caption: text("caption"),
  hashtags: text("hashtags", { mode: "json" }),
  ctaText: text("cta_text"),
  productLinkId: text("product_link_id").references(() => productLinks.id),
  status: text("status", { enum: ["pending", "processing", "done", "failed"] }).default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProductLink = typeof productLinks.$inferSelect;
export type Clip = typeof clips.$inferSelect;
