import { createInsertSchema } from "drizzle-zod";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { ordersTable } from "./orders";

export const fulfillmentsTable = pgTable(
  "fulfillments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" })
      .unique(),
    provider: text("provider").notNull(),
    status: text("status").notNull().default("pending"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    retryCount: text("retry_count").notNull().default("0"),
    lastErrorCode: text("last_error_code"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("fulfillments_status_retry_idx").on(table.status, table.nextAttemptAt)],
);

export const providerOrdersTable = pgTable(
  "provider_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerInvoiceId: text("provider_invoice_id"),
    providerOrderId: text("provider_order_id"),
    providerStatus: text("provider_status").notNull(),
    webhookEventIds: text("webhook_event_ids").array().notNull().default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("provider_orders_order_idx").on(table.orderId),
    index("provider_orders_provider_ids_idx").on(
      table.provider,
      table.providerInvoiceId,
      table.providerOrderId,
    ),
  ],
);

export const deliveryArtifactsTable = pgTable(
  "delivery_artifacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" })
      .unique(),
    privateObjectPath: text("private_object_path"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    status: text("status").notNull().default("not_ready"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [index("delivery_artifacts_status_idx").on(table.status)],
);

export const insertFulfillmentSchema = createInsertSchema(fulfillmentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProviderOrderSchema = createInsertSchema(providerOrdersTable).omit({
  id: true,
  updatedAt: true,
});
export const insertDeliveryArtifactSchema = createInsertSchema(deliveryArtifactsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertFulfillment = z.infer<typeof insertFulfillmentSchema>;
export type FulfillmentRecord = typeof fulfillmentsTable.$inferSelect;
export type ProviderOrderRecord = typeof providerOrdersTable.$inferSelect;
export type DeliveryArtifactRecord = typeof deliveryArtifactsTable.$inferSelect;
