CREATE TABLE `clips` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`start_time` real NOT NULL,
	`end_time` real NOT NULL,
	`description` text,
	`confidence_score` real,
	`output_path` text,
	`format` text DEFAULT 'tiktok',
	`caption` text,
	`hashtags` text,
	`cta_text` text,
	`product_link_id` text,
	`status` text DEFAULT 'pending',
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_link_id`) REFERENCES `product_links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_links` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`image` text,
	`category` text,
	`matched_scenes` text,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_video_path` text,
	`source_video_name` text,
	`duration` real,
	`scene_timeline` text,
	`status` text DEFAULT 'created',
	`created_at` integer,
	`updated_at` integer
);
