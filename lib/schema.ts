import { pgTable, serial, varchar, timestamp, text, boolean } from "drizzle-orm/pg-core";

// Définition du schéma de la table users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Types dérivés du schéma pour TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
