import { relations } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import z from 'zod';
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

export const bookSchema = z.object({
  ISBN: z.string().trim().min(1),
  bookName: z.string().trim().min(1),
  author: z.string().trim().min(1),
  publisher: z.string().trim().min(1),
  publishDate: z.string().trim().min(1),
  category: z.string().trim().min(1),
  price: z.number().positive(),
  totalStock: z.number().int().min(0),
  availableStock: z.number().int().min(0),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(bookStatusEnum.enumValues),
  createdAt: z.date(),
});

export type Book = z.infer<typeof bookSchema>;

// 创建图书的参数校验
export const createBookSchema = bookSchema.omit({
  status: true,
  createdAt: true,
});

export type CreateBook = z.infer<typeof createBookSchema>;

// 修改图书的类型校验
export const updateBookSchema = bookSchema
  .omit({
    ISBN: true,
    createdAt: true,
  })
  .partial(); // 把所有字段改成可选的，修改时不一定全改

export type UpdateBook = z.infer<typeof updateBookSchema>;

export const bookRelations = relations(book, ({ many }) => ({
  borrowingRecord: many(borrowingRecord),
}));
