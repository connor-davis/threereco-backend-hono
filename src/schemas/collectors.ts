import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import { users } from "./users";

export const collectors = pgTable("collectors", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  idNumber: text("id_number").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  province: text("province"),
  zipCode: text("zip_code"),
  bankName: text("bank_name").notNull(),
  bankAccountHolder: text("bank_account_holder").notNull(),
  bankAccountNumber: text("bank_account_number").notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const collectorsUser = relations(collectors, ({ one }) => ({
  user: one(users, {
    fields: [collectors.userId],
    references: [users.id],
  }),
}));

export const userCollectors = relations(users, ({ many }) => ({
  collectors: many(collectors),
}));
