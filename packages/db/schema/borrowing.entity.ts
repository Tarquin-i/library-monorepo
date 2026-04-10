import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  serial,
  integer,
} from 'drizzle-orm/pg-core';
import { user } from './user.entity';
import { book } from './book.entity';
import { relations } from 'drizzle-orm';

export const borrowingStatusEnum = pgEnum('borrowing_status', [
  'pending',
  'returned',
  'approved',
  'rejected',
  'cancelled',
]);

export const borrowingRecord = pgTable('borrowing_record', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  ISBN: text('isbn')
    .notNull()
    .references(() => book.ISBN, { onDelete: 'restrict' }),
  status: borrowingStatusEnum('status').notNull().default('pending'),

  borrowDate: timestamp('borrow_date'), // 原定借阅时间
  dueDate: timestamp('due_date'), // 应归还时间
  returnDate: timestamp('return_date'), // 实际归还时间

  quantity: integer('quantity').notNull().default(1), // 借阅数量
  borrowDays: integer('borrow_days').notNull().default(30), // 申请借阅天数

  overdueDays: integer('overdue_days').default(0), // 逾期天数
  renewalCount: integer('renewal_count').default(0).notNull(), // 续借次数

  reviewerId: text('reviewer_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  rejectReason: text('reject_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const borrowingRecordRelations = relations(
  borrowingRecord,
  ({ one }) => ({
    user: one(user, {
      fields: [borrowingRecord.userId],
      references: [user.id],
    }),
    book: one(book, {
      fields: [borrowingRecord.ISBN],
      references: [book.ISBN],
    }),
    reviewer: one(user, {
      fields: [borrowingRecord.reviewerId],
      references: [user.id],
    }),
  }),
);
