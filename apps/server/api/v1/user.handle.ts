import { Hono } from 'hono';
import { db } from '@demo/db';
import { user } from '@demo/db/schema/user.entity';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';

// 可用角色列表
const validRoles = ['admin', 'librarian', 'reader'];

const app = new Hono()
  // 获取可用角色列表
  .get('/roles', (c) => {
    return c.json({ data: validRoles });
  })
  // 获取用户列表
  .get('/users', async (c) => {
    const result = await db.select().from(user);
    return c.json({ data: result });
  })
  // 修改用户角色
  .patch(
    '/users/:id/role',
    zValidator(
      'param',
      z.object({
        id: z.string(),
      }),
    ),
    zValidator(
      'json',
      z.object({
        role: z.string(),
      }),
    ),
    async (c) => {
      const { id } = c.req.valid('param');
      const { role } = await c.req.valid('json');

      // 使用 returning() 获取更新后的用户数据，不用再单独查询一次
      const result = await db
        .update(user)
        .set({ role })
        .where(eq(user.id, id))
        .returning();

      if (result.length === 0) {
        return c.json({ message: '用户不存在' }, 404);
      }

      return c.json({ data: result[0] });
    },
  );

export default app;
