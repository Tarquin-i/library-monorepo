import { pgTable, text } from 'drizzle-orm/pg-core';

export const book = pgTable('book', {
  ISBN: text('id').primaryKey().unique(),
  bookName: text('name').notNull(),
  
});


