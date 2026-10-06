import { createInsertSchema } from "drizzle-zod";
import { index, jsonb, pgTable, text, timestamp, uuid, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { ordersTable } from "./orders";

export const purchaseAccessTable = pgTable(
  "purchase_access",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" })
      .unique(),
    tokenHash: text("token_hash").notNull().unique(),
    encryptedToken: jsonb("encrypted_token").$type<Record<string, unknown>>().notNull(),
    status: text("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    firstAccessedAt: timestamp("first_accessed_at", { withTimezone: true }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  },
  (table) => [
    index("purchase_access_status_expiry_idx").on(table.status, table.expiresAt),
    check(
      "purchase_access_status_check",
      sql`${table.status} in ('ACTIVE', 'CONSUMED', 'EXPIRED', 'REVOKED')`,
    ),
  ],
);

export const purchaseDeliveryEventsTable = pgTable(
  "purchase_delivery_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purchaseAccessId: uuid("purchase_access_id")
      .notNull()
      .references(() => purchaseAccessTable.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("purchase_delivery_events_access_created_idx").on(
      table.purchaseAccessId,
      table.createdAt,
    ),
    check(
      "purchase_delivery_events_type_check",
      sql`${table.eventType} in ('PURCHASE_VIEWED', 'CODE_REVEALED', 'CODE_COPIED', 'FILE_DOWNLOAD_STARTED', 'FILE_DOWNLOAD_COMPLETED', 'REDEMPTION_LINK_OPENED', 'LEAVE_CONFIRMED', 'ACCESS_CONSUMED')`,
    ),
  ],
);

export const insertPurchaseAccessSchema = createInsertSchema(purchaseAccessTable).omit({
  id: true,
  createdAt: true,
});
export const insertPurchaseDeliveryEventSchema = createInsertSchema(
  purchaseDeliveryEventsTable,
).omit({
  id: true,
  createdAt: true,
});

export type PurchaseAccessRecord = typeof purchaseAccessTable.$inferSelect;
export type PurchaseDeliveryEventRecord = typeof purchaseDeliveryEventsTable.$inferSelect;
export type InsertPurchaseAccess = z.infer<typeof insertPurchaseAccessSchema>;
export type InsertPurchaseDeliveryEvent = z.infer<typeof insertPurchaseDeliveryEventSchema>;
