import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as auth from './schema/user.schema';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...auth,
  },
});
