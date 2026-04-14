import { relations } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { borrowingRecord } from './borrowing.entity';

export const bookStatusEnum = pgEnum('book_status', [
  'available',
  'borrowed',
  'lost',
  'scrapped',
]);

export const book = pgTable('book', {
  ISBN: text('isbn').primaryKey(),
  bookName: text('book_name').notNull(),
  author: text('author').notNull(),
  publisher: text('publisher').notNull(),
  publishDate: text('publish_date').notNull(),
  category: text('category').notNull(),
  price: real('price').notNull(),
  totalStock: integer('total_stock').notNull(),
  availableStock: integer('available_stock').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  status: bookStatusEnum('status').notNull().default('available'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const bookRelations = relations(book, ({ many }) => ({
  borrowingRecord: many(borrowingRecord),
}));
