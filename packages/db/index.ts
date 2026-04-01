import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as auth from './schema/user.entity';
import * as bookSchema from './schema/book.entity';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...auth,
    ...bookSchema,
  },
});
