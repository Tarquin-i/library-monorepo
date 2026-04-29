import { zValidator } from '@hono/zod-validator';
import { db } from '@tarquin/db';
import {
  book,
  createBookSchema,
  updateBookSchema,
} from '@tarquin/db/schema/book.entity';
import { borrowingRecord } from '@tarquin/db/schema/borrowing.entity';
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import z from 'zod';
import { requireRole } from '../../lib/permission';

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
    zValidator('param', z.object({ isbn: z.string().trim().min(1) })),
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

        // 如果有传可借数量和藏馆数量，则使用传入的，否则使用现有的数量
        const currentBook = existing[0];
        const nextTotalStock = data.totalStock ?? currentBook.totalStock;
        const nextAvailableStock =
          data.availableStock ?? currentBook.availableStock;

        // 如果只传了可借数量，可借数量可能会大于藏品数量
        if (nextAvailableStock > nextTotalStock) {
          return c.json({ message: '可借数量不能大于馆藏数量' }, 400);
        }

        // 一次性更新所有字段
        const result = await db
          .update(book)
          .set(data)
          .where(eq(book.ISBN, currentBook.ISBN))
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
    zValidator('param', z.object({ isbn: z.string().trim().min(1) })),
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

        // 删除时以借阅流程状态为准，避免库存字段与历史流水脱节时误判。
        const hasActiveBorrowingFlow = records.some(
          (record) =>
            record.status === 'pending' ||
            record.status === 'approved' ||
            record.status === 'return_pending',
        );

        if (hasActiveBorrowingFlow) {
          return c.json({ message: '该书籍仍有关联借阅流程，无法删除' }, 400);
        }

        await db.transaction(async (tx) => {
          await tx
            .delete(borrowingRecord)
            .where(eq(borrowingRecord.ISBN, isbn));
          await tx.delete(book).where(eq(book.ISBN, isbn));
        });

        return c.json({ data: { success: true } });
      } catch (error) {
        console.error('删除书籍失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  );

export default app;
