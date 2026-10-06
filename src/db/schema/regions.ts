import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const regionsTable = pgTable("regions", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  currencySymbol: text("currency_symbol").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertRegionSchema = createInsertSchema(regionsTable).omit({
  updatedAt: true,
});
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type RegionRecord = typeof regionsTable.$inferSelect;
