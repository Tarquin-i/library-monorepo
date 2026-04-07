import { Hono } from 'hono';
import { db } from '@demo/db';
import { book } from '@demo/db/schema/book.entity';
import { zValidator } from '@hono/zod-validator';
import { eq, sql } from 'drizzle-orm';
import z from 'zod';
import { requireRole } from '../../lib/permission';

// 录入书籍的参数校验
const createBookSchema = z.object({
  ISBN: z.string().min(1),
  bookName: z.string().min(1),
  author: z.string().min(1),
  publisher: z.string().min(1),
  publishDate: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  totalStock: z.number().int().min(1),
  availableStock: z.number().int().min(0),
  description: z.string().optional(),
  coverImage: z.string().optional(),
});

const app = new Hono()
  // 获取书籍列表
  .get('/books', async (c) => {
    try {
      const result = await db.select().from(book);
      return c.json({ data: result });
    } catch (error) {
      console.error('获取书籍列表失败:', error);
      return c.json({ message: '服务器错误，请稍后重试' }, 500);
    }
  })
  // 录入书籍
  .post('/books', requireRole('admin', 'librarian'), zValidator('json', createBookSchema), async (c) => {
    try {
      const data = c.req.valid('json');

      // 查询书籍是否存在
      const existing = await db
        .select()
        .from(book)
        .where(eq(book.ISBN, data.ISBN));
      if (existing.length > 0) {
        // ISBN已存在，馆藏和可借+1
        const result = await db
          .update(book)
          .set({
            totalStock: sql`${book.totalStock} + 1`,
            availableStock: sql`${book.availableStock} + 1`,
          })
          .where(eq(book.ISBN, data.ISBN))
          .returning();
        return c.json({ data: result[0] }, 200);
      }

      const result = await db.insert(book).values(data).returning();

      return c.json({ data: result[0] }, 201);
    } catch (error) {
      console.error('录入书籍失败:', error);
      return c.json({ message: '服务器错误，请稍后重试' }, 500);
    }
  });

export default app;
