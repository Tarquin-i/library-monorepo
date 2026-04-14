import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bookSchema from './schema/book.entity';
import * as borrowingSchema from './schema/borrowing.entity';
import * as renewalSchema from './schema/renewal.entity';
import * as auth from './schema/user.entity';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...auth,
    ...bookSchema,
    ...borrowingSchema,
    ...renewalSchema,
  },
});
