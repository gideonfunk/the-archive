CREATE TABLE `anonymous_users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `art_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`purpose` text NOT NULL,
	`object_key` text NOT NULL,
	`public_url` text,
	`width` integer,
	`height` integer,
	`format` text,
	`generator_provider` text,
	`prompt` text,
	`source_inputs` text,
	`approval_status` text DEFAULT 'pending' NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lyrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track_id` integer NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`source` text,
	`source_url` text,
	`plain_text` text,
	`synchronized_json` text,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	`rights_status` text DEFAULT 'unknown' NOT NULL,
	`verified_at` text,
	`verified_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lyrics_track_language_idx` ON `lyrics` (`track_id`,`language`);--> statement-breakpoint
CREATE TABLE `personas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`primary_color` text NOT NULL,
	`description` text,
	`theological_statement` text,
	`status` text DEFAULT 'active' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personas_slug_unique` ON `personas` (`slug`);--> statement-breakpoint
CREATE TABLE `play_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track_version_id` integer NOT NULL,
	`user_id` text,
	`source` text NOT NULL,
	`campaign` text,
	`play_duration` integer,
	`qualified` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`track_version_id`) REFERENCES `track_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `anonymous_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `publishing_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`action` text NOT NULL,
	`prior_status` text,
	`new_status` text,
	`curator` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `qr_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`short_code` text NOT NULL,
	`destination_type` text NOT NULL,
	`destination_id` integer,
	`destination_url` text,
	`campaign` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `qr_links_short_code_unique` ON `qr_links` (`short_code`);--> statement-breakpoint
CREATE TABLE `release_tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`release_id` integer NOT NULL,
	`track_id` integer NOT NULL,
	`position` integer NOT NULL,
	`version_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`version_id`) REFERENCES `track_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `release_tracks_release_position_idx` ON `release_tracks` (`release_id`,`position`);--> statement-breakpoint
CREATE TABLE `releases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`persona_id` integer NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`release_date` text,
	`published_at` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `releases_persona_slug_idx` ON `releases` (`persona_id`,`slug`);--> statement-breakpoint
CREATE TABLE `track_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `anonymous_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `track_ratings_track_user_idx` ON `track_ratings` (`track_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `track_tag_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`user_id` text,
	`source` text NOT NULL,
	`moderation_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `anonymous_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `track_tag_assignments_track_user_tag_idx` ON `track_tag_assignments` (`track_id`,`user_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `track_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track_id` integer NOT NULL,
	`version` text NOT NULL,
	`purpose` text NOT NULL,
	`duration` integer,
	`checksum` text,
	`loudness_integrated` text,
	`loudness_range` text,
	`true_peak` text,
	`sample_rate` integer,
	`bit_depth` integer,
	`object_key` text,
	`public_url` text,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`persona_id` integer NOT NULL,
	`track_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`genre` text,
	`language` text DEFAULT 'en' NOT NULL,
	`explicit` integer DEFAULT false NOT NULL,
	`isrc` text,
	`curator_tags` text,
	`scripture_references` text,
	`rights_note` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_track_id_unique` ON `tracks` (`track_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_slug_unique` ON `tracks` (`slug`);--> statement-breakpoint
DROP TABLE `ratings`;--> statement-breakpoint
DROP INDEX `tags_track_device_tag_idx`;--> statement-breakpoint
ALTER TABLE `tags` ADD `display_label` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `normalized_slug` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `blocked` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_normalized_slug_unique` ON `tags` (`normalized_slug`);--> statement-breakpoint
ALTER TABLE `tags` DROP COLUMN `track_id`;--> statement-breakpoint
ALTER TABLE `tags` DROP COLUMN `device_id`;--> statement-breakpoint
ALTER TABLE `tags` DROP COLUMN `tag`;