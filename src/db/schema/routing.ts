import { createInsertSchema } from "drizzle-zod";
import { index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { ordersTable } from "./orders";

export const privacyRoutesTable = pgTable(
  "privacy_routes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" })
      .unique(),
    provider: text("provider").notNull(),
    providerExchangeId: text("provider_exchange_id").notNull(),
    status: text("status").notNull().default("created"),
    outputAsset: text("output_asset").notNull(),
    outputNetwork: text("output_network").notNull(),
    rateMode: text("rate_mode"),
    quoteRateId: text("quote_rate_id"),
    estimatedOutputAmount: numeric("estimated_output_amount", {
      precision: 36,
      scale: 18,
    }),
    quoteCreatedAt: timestamp("quote_created_at", { withTimezone: true }),
    quoteExpiresAt: timestamp("quote_expires_at", { withTimezone: true }),
    outputAmount: numeric("output_amount", { precision: 36, scale: 18 }),
    outputTransactionHash: text("output_transaction_hash"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("privacy_routes_provider_exchange_idx").on(table.provider, table.providerExchangeId),
  ],
);

export const settlementsTable = pgTable("settlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" })
    .unique(),
  asset: text("asset").notNull(),
  network: text("network").notNull(),
  amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status").notNull().default("pending"),
  confirmations: numeric("confirmations", { precision: 10, scale: 0 }).notNull().default("0"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPrivacyRouteSchema = createInsertSchema(privacyRoutesTable).omit({
  id: true,
  updatedAt: true,
});
export const insertSettlementSchema = createInsertSchema(settlementsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPrivacyRoute = z.infer<typeof insertPrivacyRouteSchema>;
export type PrivacyRouteRecord = typeof privacyRoutesTable.$inferSelect;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type SettlementRecord = typeof settlementsTable.$inferSelect;
