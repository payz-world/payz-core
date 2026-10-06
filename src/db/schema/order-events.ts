import { createInsertSchema } from "drizzle-zod";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { ordersTable } from "./orders";

export const orderEventsTable = pgTable(
  "order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("order_events_order_created_idx").on(table.orderId, table.createdAt)],
);

export const insertOrderEventSchema = createInsertSchema(orderEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrderEvent = z.infer<typeof insertOrderEventSchema>;
export type OrderEventRecord = typeof orderEventsTable.$inferSelect;
