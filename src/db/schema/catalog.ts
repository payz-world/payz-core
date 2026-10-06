import { createInsertSchema } from "drizzle-zod";
import { boolean, index, jsonb, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { regionsTable } from "./regions";

export const productsTable = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerProductId: text("provider_product_id").notNull(),
    regionCode: text("region_code")
      .notNull()
      .references(() => regionsTable.code),
    brand: text("brand").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    sourceCategory: text("source_category").notNull().default(""),
    categoryId: text("category_id").notNull(),
    currency: text("currency").notNull(),
    productType: text("product_type").notNull(),
    providerType: text("provider_type").notNull().default(""),
    productGroupId: text("product_group_id").notNull().default(""),
    providerMetadata: jsonb("provider_metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    imageUrl: text("image_url"),
    inStock: boolean("in_stock").notNull().default(false),
    presentInLatestSync: boolean("present_in_latest_sync").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    usdRate: numeric("usd_rate", { precision: 20, scale: 10 }),
    rangeMin: numeric("range_min", { precision: 18, scale: 2 }),
    rangeMax: numeric("range_max", { precision: 18, scale: 2 }),
    rangeStep: numeric("range_step", { precision: 18, scale: 2 }),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("products_provider_product_region_uq").on(
      table.provider,
      table.providerProductId,
      table.regionCode,
    ),
    index("products_region_category_stock_idx").on(
      table.regionCode,
      table.categoryId,
      table.inStock,
    ),
    index("products_group_region_idx").on(table.productGroupId, table.regionCode),
  ],
);

export const productDenominationsTable = pgTable(
  "product_denominations",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    providerPackageId: text("provider_package_id").notNull(),
    value: numeric("value", { precision: 18, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    usdValue: numeric("usd_value", { precision: 18, scale: 2 }),
    inStock: boolean("in_stock").notNull().default(true),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_denominations_package_uq").on(
      table.productId,
      table.providerPackageId,
    ),
    index("product_denominations_product_value_idx").on(table.productId, table.value),
  ],
);

export const insertProductSchema = createInsertSchema(productsTable).omit({
  syncedAt: true,
  updatedAt: true,
});
export const insertProductDenominationSchema = createInsertSchema(
  productDenominationsTable,
).omit({ syncedAt: true });

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductRecord = typeof productsTable.$inferSelect;
export type InsertProductDenomination = z.infer<typeof insertProductDenominationSchema>;
export type ProductDenominationRecord = typeof productDenominationsTable.$inferSelect;
