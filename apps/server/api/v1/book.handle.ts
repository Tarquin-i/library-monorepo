import { Hono } from 'hono';
import { db } from '@demo/db';
import { book } from '@demo/db/schema/book.entity';
import { borrowingRecord } from '@demo/db/schema/borrowing.entity';
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

// 修改书籍的参数校验
const updateBookSchema = z.object({
  bookName: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  publisher: z.string().min(1).optional(),
  publishDate: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  totalStock: z.number().int().min(0).optional(),
  availableStock: z.number().int().min(0).optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(['available', 'borrowed', 'lost', 'scrapped']).optional(),
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
  .post(
    '/books',
    requireRole('admin', 'librarian'),
    zValidator('json', createBookSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        // 查询书籍是否存在
        const existing = await db
          .select()
          .from(book)
          .where(eq(book.ISBN, data.ISBN));

        if (data.availableStock > data.totalStock) {
          return c.json({ message: '可借数量不能大于馆藏数量' }, 400);
        }

        if (existing.length > 0) {
          // ISBN已存在，按本次输入的数量追加馆藏和可借库存
          const result = await db
            .update(book)
            .set({
              totalStock: sql`${book.totalStock} + ${data.totalStock}`,
              availableStock: sql`${book.availableStock} + ${data.availableStock}`,
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
    },
  )
  // 修改书籍信息
  .patch(
    '/books/:isbn',
    requireRole('admin', 'librarian'),
    zValidator('param', z.object({ isbn: z.string() })),
    zValidator('json', updateBookSchema),
    async (c) => {
      try {
        const { isbn } = c.req.valid('param');
        const data = c.req.valid('json');

        // 检查书籍是否存在
        const existing = await db
          .select()
          .from(book)
          .where(eq(book.ISBN, isbn));

        if (existing.length === 0) {
          return c.json({ message: '书籍不存在' }, 404);
        }

        // 一次性更新所有字段
        const result = await db
          .update(book)
          .set(data)
          .where(eq(book.ISBN, isbn))
          .returning();

        return c.json({ data: result[0] });
      } catch (error) {
        console.error('修改书籍失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 删除书籍
  .delete(
    '/books/:isbn',
    requireRole('admin', 'librarian'),
    zValidator('param', z.object({ isbn: z.string() })),
    async (c) => {
      try {
        const { isbn } = c.req.valid('param');

        // 检查书籍是否存在
        const existing = await db
          .select()
          .from(book)
          .where(eq(book.ISBN, isbn));

        if (existing.length === 0) {
          return c.json({ message: '书籍不存在' }, 404);
        }

        // 检查是否有借阅记录
        const records = await db
          .select()
          .from(borrowingRecord)
          .where(eq(borrowingRecord.ISBN, isbn));

        if (records.length > 0) {
          return c.json({ message: '该书籍有借阅记录，无法删除' }, 400);
        }

        // 删除书籍
        await db.delete(book).where(eq(book.ISBN, isbn));

        return c.json({ message: '删除成功' });
      } catch (error) {
        console.error('删除书籍失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  );

export default app;
