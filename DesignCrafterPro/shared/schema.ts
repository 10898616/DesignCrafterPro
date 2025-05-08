import { pgTable, text, serial, integer, boolean, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  designs: many(designs),
  preferences: many(userPreferences),
}));

// Designs table
export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  roomWidth: integer("room_width").notNull(),
  roomLength: integer("room_length").notNull(),
  roomHeight: integer("room_height").notNull(),
  wallColor: text("wall_color").notNull(),
  furniture: jsonb("furniture").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const designsRelations = relations(designs, ({ one }) => ({
  user: one(users, {
    fields: [designs.userId],
    references: [users.id],
  }),
}));

// User Preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique().notNull(),
  defaultTheme: text("default_theme").default("system").notNull(),
  enableGridSnapping: boolean("enable_grid_snapping").default(true).notNull(),
  enableAutoSave: boolean("enable_auto_save").default(false).notNull(),
  defaultRoomWidth: text("default_room_width").default("12").notNull(),
  defaultRoomLength: text("default_room_length").default("15").notNull(),
  defaultRoomHeight: text("default_room_height").default("8").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
// User schemas
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectUserSchema = createSelectSchema(users);

// Design schemas
export const furnitureItemSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  color: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  rotation: z.number().min(0).max(359),
});

export const insertDesignSchema = createInsertSchema(designs, {
  name: (schema) => schema.min(1, "Design name is required"),
  roomWidth: (schema) => schema.positive("Room width must be positive"),
  roomLength: (schema) => schema.positive("Room length must be positive"),
  roomHeight: (schema) => schema.positive("Room height must be positive"),
}).extend({
  furniture: z.array(furnitureItemSchema),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateDesignSchema = insertDesignSchema.partial().omit({ userId: true });

export const selectDesignSchema = createSelectSchema(designs).extend({
  furniture: z.array(furnitureItemSchema),
});

// User Preferences schema
export const userPreferencesSchema = createInsertSchema(userPreferences, {
  defaultTheme: (schema) => schema.refine(
    val => ["system", "light", "dark"].includes(val),
    { message: "Theme must be system, light, or dark" }
  ),
  defaultRoomWidth: (schema) => schema.min(1, "Default room width is required"),
  defaultRoomLength: (schema) => schema.min(1, "Default room length is required"),
  defaultRoomHeight: (schema) => schema.min(1, "Default room height is required"),
}).omit({ id: true, userId: true, createdAt: true, updatedAt: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Design = typeof designs.$inferSelect;
export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type UpdateDesign = z.infer<typeof updateDesignSchema>;
export type FurnitureItem = z.infer<typeof furnitureItemSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
