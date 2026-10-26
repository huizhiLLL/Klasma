CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resources_slug_unique` ON `resources` (`slug`);
--> statement-breakpoint
CREATE TABLE `resource_links` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`label` text DEFAULT '' NOT NULL
);
