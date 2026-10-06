import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const catalogSyncStateTable = pgTable("catalog_sync_state", {
  provider: text("provider").primaryKey(),
  catalogVersion: text("catalog_version").notNull(),
  lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
  retryAfter: timestamp("retry_after", { withTimezone: true }),
  syncStartedAt: timestamp("sync_started_at", { withTimezone: true }),
  syncCompletedAt: timestamp("sync_completed_at", { withTimezone: true }),
  syncStatus: text("sync_status").notNull().default("idle"),
  syncError: text("sync_error"),
  nextSyncAt: timestamp("next_sync_at", { withTimezone: true }),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
