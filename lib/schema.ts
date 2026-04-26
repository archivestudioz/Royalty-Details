import { pgTable, serial, integer, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  vehicle: text("vehicle"),
  service: text("service"),
  message: text("message"),
  source: text("source").default("contact"),
  referrer: text("referrer"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  landingPath: text("landing_path"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  location: text("location"),
  serviceType: text("service_type"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  durationMin: integer("duration_min").default(60).notNull(),
  status: text("status").default("scheduled").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  travelMinutes: integer("travel_minutes"),
  submissionId: integer("submission_id"),
  notes: text("notes"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type User = typeof users.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
