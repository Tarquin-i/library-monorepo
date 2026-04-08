import { zValidator } from '@hono/zod-validator';
import { db } from '@demo/db';
import { Hono } from 'hono';
import { z } from 'zod';
import { book } from '@demo/db/schema/book.entity';
import { eq, sql, and } from 'drizzle-orm';
import { borrowingRecord } from '@demo/db/schema/borrowing.entity';
import { requireRole } from '../../lib/permission';

const app = new Hono()
  // 借书申请
  .post(
    '/borrowings/apply',
    zValidator(
      'json',
      z.object({
        ISBN: z.string(),
        userId: z.string(),
      }),
    ),
    async (c) => {
      try {
        const { ISBN, userId } = c.req.valid('json');
        const bookRes = await db.select().from(book).where(eq(book.ISBN, ISBN));

        if (bookRes.length === 0) {
          return c.json({ message: '图书不存在' }, 404);
        }

        if (
          bookRes[0].availableStock <= 0 ||
          bookRes[0].status === 'lost' ||
          bookRes[0].status === 'scrapped'
        ) {
          return c.json({ message: '可借图书库存不足' }, 400);
        }

        // 校验：用户当前借阅数量不能超过5本
        const currentBorrowings = await db
          .select()
          .from(borrowingRecord)
          .where(
            and(
              eq(borrowingRecord.userId, userId),
              eq(borrowingRecord.status, 'approved'),
            ),
          );

        if (currentBorrowings.length >= 5) {
          return c.json({ message: '您已借阅5本书籍，无法继续借阅' }, 400);
        }

        // 校验：用户是否有逾期未归还的书籍
        const overdueBooks = await db
          .select()
          .from(borrowingRecord)
          .where(
            and(
              eq(borrowingRecord.userId, userId),
              eq(borrowingRecord.status, 'approved'),
              sql`${borrowingRecord.dueDate} < NOW()`, // 当前时间大于归还时间（逾期）
            ),
          );

        if (overdueBooks.length > 0) {
          return c.json({ message: '您有逾期未归还的书籍，无法借阅新书' }, 400);
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
  // 管理员获取借阅申请列表
  .get(
    '/borrowings/applications',
    requireRole('admin', 'librarian'),
    async (c) => {
      try {
        const result = await db.select().from(borrowingRecord);
        return c.json({ data: result });
      } catch (error) {
        console.error('获取申请列表失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 取消借阅申请
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
  )
  // 审批借阅申请
  .patch(
    '/borrowings/applications/:id/approve',
    requireRole('admin', 'librarian'),
    zValidator('param', z.object({ id: z.string().transform(Number) })),
    zValidator('json', z.object({ reviewerId: z.string() })),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const { reviewerId } = c.req.valid('json');
        const borrowDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(borrowDate.getDate() + 30); //LINK 默认借阅30天

        const result = await db
          .update(borrowingRecord)
          .set({
            status: 'approved',
            reviewerId,
            borrowDate,
            dueDate,
          })
          .where(eq(borrowingRecord.id, id))
          .returning();

        if (result.length === 0) {
          return c.json({ message: '借阅记录不存在' }, 404);
        }

        await db
          .update(book)
          .set({ availableStock: sql`${book.availableStock} - 1` })
          .where(eq(book.ISBN, result[0].ISBN));

        return c.json({ data: result[0] });
      } catch (error) {
        console.error('审批申请失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 拒绝借阅申请
  .patch(
    '/borrowings/applications/:id/reject',
    requireRole('admin', 'librarian'),
    zValidator('param', z.object({ id: z.string().transform(Number) })),
    zValidator(
      'json',
      z.object({ reviewerId: z.string(), rejectReason: z.string() }),
    ),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const { reviewerId, rejectReason } = c.req.valid('json');

        const existing = await db
          .select()
          .from(borrowingRecord)
          .where(eq(borrowingRecord.id, id));

        if (existing.length === 0) {
          return c.json({ message: '借阅记录不存在' }, 404);
        }
        if (existing[0].status !== 'pending') {
          return c.json({ message: '只能拒绝待审核的借阅申请' }, 400);
        }

        const result = await db
          .update(borrowingRecord)
          .set({
            status: 'rejected',
            reviewerId,
            rejectReason,
          })
          .where(eq(borrowingRecord.id, id))
          .returning();

        return c.json({ data: result[0] });
      } catch (error) {
        console.error('拒绝申请失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 归还图书
  .patch(
    '/borrowings/:id/return',
    requireRole('admin', 'librarian'),
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
        if (existing[0].status !== 'approved') {
          return c.json({ message: '只能归还已批准的借阅' }, 400);
        }

        const returnDate = new Date();
        const dueDate = existing[0].dueDate;
        let overdueDays = 0;

        // 计算逾期天数
        if (dueDate && returnDate > dueDate) {
          overdueDays = Math.ceil(
            (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
          );
        }

        // 更新借阅记录状态为已归还，设置实际归还时间和逾期天数
        const result = await db
          .update(borrowingRecord)
          .set({
            status: 'returned',
            returnDate,
            overdueDays,
          })
          .where(eq(borrowingRecord.id, id))
          .returning();

        // 一次性更新库存和状态
        await db
          .update(book)
          .set({
            availableStock: sql`${book.availableStock} + 1`,
            status: sql`CASE WHEN ${book.status} IN ('borrowed', 'lost') THEN 'available'::"book_status" ELSE ${book.status} END`,
          })
          .where(eq(book.ISBN, result[0].ISBN));

        return c.json({ data: result[0] });
      } catch (error) {
        console.error('归还图书失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 查询自己的借阅记录
  .get(
    '/borrowings/my-records',
    zValidator('query', z.object({ userId: z.string() })),
    async (c) => {
      try {
        const { userId } = c.req.valid('query');

        const result = await db
          .select()
          .from(borrowingRecord)
          .where(eq(borrowingRecord.userId, userId));

        return c.json({ data: result });
      } catch (error) {
        console.error('查询借阅记录失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 管理员查询所有借阅记录
  .get(
    '/borrowings/records',
    requireRole('admin', 'librarian'),
    zValidator(
      'query',
      z.object({
        status: z.string().optional(),
        userId: z.string().optional(),
        ISBN: z.string().optional(),
      }),
    ),
    async (c) => {
      try {
        const { status, userId, ISBN } = c.req.valid('query');

        //LINK 这里的 any 需要进一步处理一下
        let query: any = db.select().from(borrowingRecord);

        if (status) {
          query = query.where(eq(borrowingRecord.status, status as any));
        }
        if (userId) {
          query = query.where(eq(borrowingRecord.userId, userId));
        }
        if (ISBN) {
          query = query.where(eq(borrowingRecord.ISBN, ISBN));
        }

        const result = await query;

        return c.json({ data: result });
      } catch (error) {
        console.error('查询借阅记录失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  );

export default app;
