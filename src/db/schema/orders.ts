import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { productDenominationsTable, productsTable } from "./catalog";

export const guestSessionsTable = pgTable("guest_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const ordersTable = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicOrderId: text("public_order_id").notNull().unique(),
    guestSessionId: uuid("guest_session_id")
      .notNull()
      .references(() => guestSessionsTable.id),
    idempotencyKey: text("idempotency_key"),
    status: text("status").notNull().default("PAYMENT_PENDING"),
    productId: text("product_id")
      .notNull()
      .references(() => productsTable.id),
    regionCode: text("region_code").notNull(),
    fiatAmount: numeric("fiat_amount", { precision: 18, scale: 2 }).notNull(),
    fiatCurrency: text("fiat_currency").notNull(),
    payzMarkup: numeric("payz_markup", { precision: 18, scale: 2 }).notNull(),
    // This legacy column stores the USD-denominated USDC settlement target.
    settlementAmountUsdc: numeric("customer_total", { precision: 18, scale: 2 }).notNull(),
    paymentNetwork: text("payment_network").notNull(),
    paymentAsset: text("payment_asset").notNull(),
    paymentStatus: text("payment_status").notNull().default("waiting"),
    routingStatus: text("routing_status").notNull().default("not_started"),
    settlementStatus: text("settlement_status").notNull().default("not_started"),
    fulfillmentStatus: text("fulfillment_status").notNull().default("not_started"),
    deliveryStatus: text("delivery_status").notNull().default("not_ready"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("orders_guest_created_idx").on(table.guestSessionId, table.createdAt),
    index("orders_status_expiry_idx").on(table.status, table.expiresAt),
    uniqueIndex("orders_guest_idempotency_uq").on(table.guestSessionId, table.idempotencyKey),
  ],
);

export const orderItemsTable = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => productsTable.id),
  denominationId: text("denomination_id")
    .notNull()
    .references(() => productDenominationsTable.id),
  quantity: numeric("quantity", { precision: 10, scale: 0 }).notNull().default("1"),
  productName: text("product_name").notNull(),
  brand: text("brand").notNull(),
  categoryId: text("category_id").notNull(),
  fiatAmount: numeric("fiat_amount", { precision: 18, scale: 2 }).notNull(),
  fiatCurrency: text("fiat_currency").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentAddressesTable = pgTable(
  "payment_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" })
      .unique(),
    network: text("network").notNull(),
    asset: text("asset").notNull(),
    address: text("address").notNull(),
    memo: text("memo"),
    expectedAmount: numeric("expected_amount", { precision: 36, scale: 18 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("payment_addresses_address_idx").on(table.address)],
);

export const paymentsTable = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),
    transactionHash: text("transaction_hash"),
    network: text("network").notNull(),
    asset: text("asset").notNull(),
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    confirmations: numeric("confirmations", { precision: 10, scale: 0 }).notNull().default("0"),
    status: text("status").notNull().default("waiting"),
    canonical: boolean("canonical").notNull().default(false),
    detectedAt: timestamp("detected_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payments_network_tx_uq").on(table.network, table.transactionHash),
    index("payments_order_status_idx").on(table.orderId, table.status),
  ],
);

export const insertGuestSessionSchema = createInsertSchema(guestSessionsTable).omit({
  id: true,
  createdAt: true,
});
export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({
  id: true,
  createdAt: true,
});
export const insertPaymentAddressSchema = createInsertSchema(paymentAddressesTable).omit({
  id: true,
  createdAt: true,
});
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
});

export type GuestSession = typeof guestSessionsTable.$inferSelect;
export type OrderRecord = typeof ordersTable.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItemRecord = typeof orderItemsTable.$inferSelect;
export type PaymentAddressRecord = typeof paymentAddressesTable.$inferSelect;
export type PaymentRecord = typeof paymentsTable.$inferSelect;
