import { db } from '@demo/db';
import { user } from '@demo/db/schema/user.entity';

export const listUsers = async (c: any) => {
  const result = await db.select().from(user);
  return c.json(
    {
      message: 'Hello from listUserHandler!',
      data: result,
    },
    200,
  );
};
