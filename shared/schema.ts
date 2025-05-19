import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// LinkedIn Profiles table to store scraped data
export const linkedinProfiles = pgTable("linkedin_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title"),
  company: text("company"),
  profileUrl: text("profile_url").unique(),
  companyUrl: text("company_url"),
  email: text("email"),
  dateAdded: timestamp("date_added").defaultNow(),
  notes: text("notes"),
  tags: text("tags").array(),
  lastContacted: timestamp("last_contacted"),
});

export const insertLinkedinProfileSchema = createInsertSchema(linkedinProfiles).omit({
  id: true,
  dateAdded: true,
});

// Searches table to track different search results
export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  searchUrl: text("search_url").notNull(),
  searchDate: timestamp("search_date").defaultNow(),
  resultsCount: serial("results_count"),
  searchCriteria: text("search_criteria"),
  userId: serial("user_id").references(() => users.id),
});

export const insertSearchSchema = createInsertSchema(searches).omit({
  id: true,
  searchDate: true,
});

// Search Results table to associate profiles with searches
export const searchResults = pgTable("search_results", {
  id: serial("id").primaryKey(),
  searchId: serial("search_id").references(() => searches.id),
  profileId: serial("profile_id").references(() => linkedinProfiles.id),
});

export const insertSearchResultSchema = createInsertSchema(searchResults).omit({
  id: true,
});

// Export types
export type InsertLinkedinProfile = z.infer<typeof insertLinkedinProfileSchema>;
export type LinkedinProfile = typeof linkedinProfiles.$inferSelect;

export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;

export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
export type SearchResult = typeof searchResults.$inferSelect;
