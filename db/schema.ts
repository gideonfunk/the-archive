import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const ratings = sqliteTable("ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackId: text("track_id").notNull(),
  deviceId: text("device_id").notNull(),
  rating: integer("rating").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("ratings_track_device_idx").on(table.trackId, table.deviceId)]);

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackId: text("track_id").notNull(),
  deviceId: text("device_id").notNull(),
  tag: text("tag").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("tags_track_device_tag_idx").on(table.trackId, table.deviceId, table.tag)]);
