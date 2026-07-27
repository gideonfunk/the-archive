CREATE TABLE `track_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`vote` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `anonymous_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `track_preferences_track_user_idx` ON `track_preferences` (`track_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `track_preferences_user_favorite_idx` ON `track_preferences` (`user_id`,`favorite`);--> statement-breakpoint
ALTER TABLE `track_versions` ADD `download_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `track_versions` ADD `download_url` text;--> statement-breakpoint
ALTER TABLE `track_versions` ADD `download_format` text;--> statement-breakpoint
ALTER TABLE `track_versions` ADD `download_size_bytes` integer;--> statement-breakpoint
ALTER TABLE `track_versions` ADD `license` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `attribution_text` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `published_at` text;