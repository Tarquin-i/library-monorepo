import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { borrowingRecord } from './borrowing.entity';
import { user } from './user.entity';
import { relations } from 'drizzle-orm';

export const renewalStatusEnum = pgEnum('renewal_status', [
  'pending',
  'approved',
  'rejected',
]);

// 续借记录表
export const renewalRecord = pgTable('renewal_record', {
  id: serial('id').primaryKey(),
  borrowingId: integer('borrowing_id')
    .notNull()
    .references(() => borrowingRecord.id, { onDelete: 'cascade' }),
  status: renewalStatusEnum('status').notNull().default('pending'),
  reviewerId: text('reviewer_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  rejectReason: text('reject_reason'),
  renewalDays: integer('renewal_days').notNull().default(15), // 续借天数
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const renewalRecordRelations = relations(renewalRecord, ({ one }) => ({
  borrowing: one(borrowingRecord, {
    fields: [renewalRecord.borrowingId],
    references: [borrowingRecord.id],
  }),
  reviewer: one(user, {
    fields: [renewalRecord.reviewerId],
    references: [user.id],
  }),
}));
