CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);
--> statement-breakpoint
CREATE TABLE `resource_tags` (
	`resource_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`resource_id`, `tag_id`),
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `resource_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`kind` text NOT NULL,
	`filename` text NOT NULL,
	`storage_type` text NOT NULL,
	`location` text NOT NULL,
	`mime_type` text DEFAULT 'application/octet-stream' NOT NULL,
	`size` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
