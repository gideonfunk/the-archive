CREATE INDEX `play_events_user_created_idx` ON `play_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `play_events_version_user_created_idx` ON `play_events` (`track_version_id`,`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `track_tag_assignments_user_created_idx` ON `track_tag_assignments` (`user_id`,`created_at`);