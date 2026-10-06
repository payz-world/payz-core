import { createInsertSchema } from "drizzle-zod";
import { index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { guestSessionsTable, ordersTable } from "./orders";

export const rewardBalancesTable = pgTable("reward_balances", {
  id: uuid("id").defaultRandom().primaryKey(),
  guestSessionId: uuid("guest_session_id")
    .notNull()
    .references(() => guestSessionsTable.id)
    .unique(),
  availableBalance: numeric("available_balance", { precision: 18, scale: 2 })
    .notNull()
    .default("0"),
  currency: text("currency").notNull().default("USD"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const rewardEventsTable = pgTable(
  "reward_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestSessionId: uuid("guest_session_id")
      .notNull()
      .references(() => guestSessionsTable.id),
    orderId: uuid("order_id").references(() => ordersTable.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("reward_events_guest_created_idx").on(table.guestSessionId, table.createdAt)],
);

export const insertRewardBalanceSchema = createInsertSchema(rewardBalancesTable).omit({
  id: true,
  updatedAt: true,
});
export const insertRewardEventSchema = createInsertSchema(rewardEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRewardBalance = z.infer<typeof insertRewardBalanceSchema>;
export type RewardBalanceRecord = typeof rewardBalancesTable.$inferSelect;
export type InsertRewardEvent = z.infer<typeof insertRewardEventSchema>;
export type RewardEventRecord = typeof rewardEventsTable.$inferSelect;
