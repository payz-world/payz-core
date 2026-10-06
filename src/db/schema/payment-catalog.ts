import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const paymentNetworksTable = pgTable(
  "payment_networks",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    logoUrl: text("logo_url"),
    nativeAssetId: text("native_asset_id"),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("payment_networks_enabled_sort_idx").on(table.enabled, table.sortOrder)],
);

export const paymentAssetsTable = pgTable(
  "payment_assets",
  {
    id: text("id").primaryKey(),
    networkId: text("network_id")
      .notNull()
      .references(() => paymentNetworksTable.id),
    ticker: text("ticker").notNull(),
    displayName: text("display_name").notNull(),
    assetType: text("asset_type").notNull(),
    logoUrl: text("logo_url"),
    contractAddress: text("contract_address"),
    decimals: integer("decimals"),
    provider: text("provider"),
    providerAssetId: text("provider_asset_id"),
    providerTicker: text("provider_ticker"),
    providerNetwork: text("provider_network"),
    providerContractAddress: text("provider_contract_address"),
    providerIdentifier: text("provider_identifier"),
    providerEnabled: boolean("provider_enabled").notNull().default(false),
    providerLastVerifiedAt: timestamp("provider_last_verified_at", { withTimezone: true }),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("payment_assets_network_ticker_uq").on(table.networkId, table.ticker),
    index("payment_assets_network_enabled_sort_idx").on(
      table.networkId,
      table.enabled,
      table.sortOrder,
    ),
    index("payment_assets_provider_route_idx").on(
      table.provider,
      table.providerTicker,
      table.providerNetwork,
    ),
  ],
);

export const insertPaymentNetworkSchema = createInsertSchema(paymentNetworksTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const insertPaymentAssetSchema = createInsertSchema(paymentAssetsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type PaymentNetworkRecord = typeof paymentNetworksTable.$inferSelect;
export type PaymentAssetRecord = typeof paymentAssetsTable.$inferSelect;
export type InsertPaymentNetwork = z.infer<typeof insertPaymentNetworkSchema>;
export type InsertPaymentAsset = z.infer<typeof insertPaymentAssetSchema>;
