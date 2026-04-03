import { zValidator } from '@hono/zod-validator';
import { db } from '@demo/db';
import { Hono } from 'hono';
import { z } from 'zod';
import { book } from '@demo/db/schema/book.entity';
import { eq } from 'drizzle-orm';
import { borrowingRecord } from '@demo/db/schema/borrowing.entity';

const applyBorrowingSchema = z.object({
  ISBN: z.string(),
  userId: z.string(),
});

const app = new Hono()
  // 借书申请
  .post(
    '/borrowings/apply',
    zValidator('json', applyBorrowingSchema),
    async (c) => {
      try {
        const { ISBN, userId } = c.req.valid('json');
        const bookRes = await db.select().from(book).where(eq(book.ISBN, ISBN));

        if (bookRes.length === 0) {
          return c.json({ message: '图书不存在' }, 404);
        }

        if (bookRes[0].status !== 'available' || bookRes[0].availableStock <= 0) {
          return c.json({ message: '图书库存不足' }, 400);
        }

        const result = await db
          .insert(borrowingRecord)
          .values({
            userId,
            ISBN,
            status: 'pending',
          })
          .returning();

        return c.json({ data: result[0] }, 201);
      } catch (error) {
        console.error('申请借阅失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  .get('/borrowings/applications', async (c) => {
    try {
      const result = await db.select().from(borrowingRecord);
      return c.json({ data: result });
    } catch (error) {
      console.error('获取申请列表失败:', error);
      return c.json({ message: '服务器错误，请稍后重试' }, 500);
    }
  })
  .patch(
    '/borrowings/applications/:id/cancel',
    zValidator('param', z.object({ id: z.string().transform(Number) })),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const existing = await db
          .select()
          .from(borrowingRecord)
          .where(eq(borrowingRecord.id, id));

        if (existing.length === 0) {
          return c.json({ message: '借阅记录不存在' }, 404);
        }

        if (existing[0].status !== 'pending') {
          return c.json({ message: '只能取消待审核的借阅申请' }, 400);
        }

        const result = await db
          .update(borrowingRecord)
          .set({ status: 'cancelled' })
          .where(eq(borrowingRecord.id, id))
          .returning();

        return c.json({ data: result[0] });
      } catch (error) {
        console.error('取消申请失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  );

export default app;
