import { createInsertSchema } from "drizzle-zod";
import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { productsTable } from "./catalog";

// Inventory is retained independently. Only active approvals can reach shoppers.
export const catalogCurationTable = pgTable("catalog_curation", {
  productId: text("product_id").primaryKey().references(() => productsTable.id),
  countryCode: text("country_code").notNull(),
  categoryId: text("category_id").notNull(),
  rank: integer("rank").notNull(),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("catalog_curation_country_category_rank_idx").on(
    table.countryCode, table.categoryId, table.active, table.featured, table.rank,
  ),
]);

export const insertCatalogCurationSchema = createInsertSchema(catalogCurationTable);
export type InsertCatalogCuration = z.infer<typeof insertCatalogCurationSchema>;
export type CatalogCuration = typeof catalogCurationTable.$inferSelect;
