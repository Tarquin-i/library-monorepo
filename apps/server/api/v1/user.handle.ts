import { Hono } from 'hono';
import { db } from '@demo/db';
import { user } from '@demo/db/schema/user.entity';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import { requireRole } from '../../lib/permission';

// 可用角色列表
const validRoles = ['admin', 'librarian', 'reader'];

const app = new Hono()
  // 获取可用角色列表
  .get('/roles', requireRole('admin'), (c) => {
    return c.json({ data: validRoles });
  })
  // 获取用户列表
  .get('/users', requireRole('admin'), async (c) => {
    try {
      const result = await db.select().from(user);
      return c.json({ data: result });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return c.json({ message: '服务器错误，请稍后重试' }, 500);
    }
  })
  // 修改用户角色
  .patch(
    '/users/:id/role',
    requireRole('admin'),
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
      try {
        const { id } = c.req.valid('param');
        const { role } = await c.req.valid('json');

        const result = await db
          .update(user)
          .set({ role })
          .where(eq(user.id, id))
          .returning();

        if (result.length === 0) {
          return c.json({ message: '用户不存在' }, 404);
        }

        return c.json({ data: result[0] });
      } catch (error) {
        console.error('修改用户角色失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  );

export default app;
