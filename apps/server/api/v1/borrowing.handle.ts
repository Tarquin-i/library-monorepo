import { db } from '@demo/db';
import { book } from '@demo/db/schema/book.entity';
import {
  borrowingRecord,
  borrowingStatusEnum,
} from '@demo/db/schema/borrowing.entity';
import { zValidator } from '@hono/zod-validator';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../lib/permission';

const app = new Hono()
  // 借书申请
  .post(
    '/borrowings/apply',
    zValidator(
      'json',
      z.object({
        ISBN: z.string(),
        userId: z.string(),
        quantity: z.number(),
        borrowDays: z.number(),
      }),
    ),
    async (c) => {
      try {
        const { ISBN, userId, quantity, borrowDays } = c.req.valid('json');
        const bookRes = await db.select().from(book).where(eq(book.ISBN, ISBN));

        if (bookRes.length === 0) {
          return c.json({ message: '图书不存在' }, 404);
        }

        // 检查图书库存数量、遗失状态和销毁状态
        if (
          bookRes[0].availableStock <= 0 ||
          bookRes[0].status === 'lost' ||
          bookRes[0].status === 'scrapped'
        ) {
          return c.json({ message: '可借图书库存不足' }, 400);
        }

        // 检查借阅数量小于当前库存
        if (bookRes[0].availableStock < quantity) {
          return c.json(
            {
              message: `可借库存不足，当前可借 ${bookRes[0].availableStock} 本`,
            },
            400,
          );
        }

        // 统计用户当前有效借阅数量（pending + approved 均计入，防止重复提交绕过限制）
        const currentBorrowings = await db
          .select()
          .from(borrowingRecord)
          .where(
            and(
              eq(borrowingRecord.userId, userId),
              // or
              inArray(borrowingRecord.status, [
                'pending',
                'approved',
                'return_pending',
              ]),
            ),
          );

        // 查询三种状态，并且累加三种状态的 quantity ，得到当前已借阅，申请中和归还中的总数
        const currentCount = currentBorrowings.reduce(
          (sum, r) => sum + r.quantity,
          0,
        );

        if (currentCount + quantity > 5) {
          return c.json(
            {
              message: `借阅数量超出限制，当前已有 ${currentCount} 本在借/待审核，最多还能借 ${5 - currentCount} 本`,
            },
            400,
          );
        }

        // 用户是否有逾期未归还的书籍
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

        // 插入借阅记录
        const result = await db
          .insert(borrowingRecord)
          .values({
            userId,
            ISBN,
            quantity,
            borrowDays,
            status: 'pending',
          })
          .returning();

        return c.json({ data: result }, 201);
      } catch (error) {
        console.error('申请借阅失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 管理员获取借阅申请列表
  .get(
    '/borrowings',
    requireRole('admin', 'librarian'),
    zValidator(
      'query',
      z.object({
        status: z.enum(borrowingStatusEnum.enumValues).optional(),
        userId: z.string().optional(),
        ISBN: z.string().optional(),
      }),
    ),
    async (c) => {
      try {
        const { status, userId, ISBN } = c.req.valid('query');

        // 通过状态、用户 id 和 ISBN 来筛选借阅图书
        const result = await db.query.borrowingRecord.findMany({
          where: and(
            status
              ? eq(borrowingRecord.status, status) // 如果是 undefined 就直接忽略，不会加进 sql 里面
              : undefined,
            userId ? eq(borrowingRecord.userId, userId) : undefined,
            ISBN ? eq(borrowingRecord.ISBN, ISBN) : undefined,
          ),
          with: {
            user: true,
          },
        });
        return c.json({ data: result });
      } catch (error) {
        console.error('获取申请列表失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 取消借阅申请
  .patch(
    '/borrowings/:id/cancel',
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
    '/borrowings/:id/approve',
    requireRole('admin', 'librarian'),
    zValidator('param', z.object({ id: z.string().transform(Number) })),
    zValidator('json', z.object({ reviewerId: z.string() })),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const { reviewerId } = c.req.valid('json');

        const existing = await db
          .select()
          .from(borrowingRecord)
          .where(eq(borrowingRecord.id, id));

        if (existing.length === 0) {
          return c.json({ message: '借阅记录不存在' }, 404);
        }

        if (existing[0].status !== 'pending') {
          return c.json({ message: '只能审批待审核的借阅申请' }, 400);
        }

        const bookData = await db
          .select()
          .from(book)
          .where(eq(book.ISBN, existing[0].ISBN));

        if (bookData.length === 0) {
          return c.json({ message: '图书不存在' }, 404);
        }

        if (bookData[0].status !== 'available') {
          return c.json({ message: '当前图书状态不允许审批借阅' }, 400);
        }

        if (bookData[0].availableStock < existing[0].quantity) {
          return c.json(
            {
              message: `图书库存不足，当前可借 ${bookData[0].availableStock} 本`,
            },
            400,
          );
        }

        const borrowDate = new Date();
        const dueDate = new Date();
        // 计算归还时间
        dueDate.setDate(borrowDate.getDate() + existing[0].borrowDays);

        const result = await db.transaction(async (tx) => {
          const approved = await tx
            .update(borrowingRecord)
            .set({
              status: 'approved',
              reviewerId,
              borrowDate,
              dueDate,
            })
            .where(eq(borrowingRecord.id, id))
            .returning();

          await tx
            .update(book)
            .set({
              availableStock: sql`${book.availableStock} - ${existing[0].quantity}`,
            }) // 更新图书库存
            .where(eq(book.ISBN, existing[0].ISBN));

          return approved[0];
        });

        return c.json({ data: result });
      } catch (error) {
        console.error('审批申请失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 管理员拒绝借阅申请
  .patch(
    '/borrowings/:id/reject',
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
  // 读者申请归还
  .patch(
    '/borrowings/:id/request-return',
    requireAuth,
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
          return c.json({ message: '只能对已批准的借阅发起归还申请' }, 400);
        }

        const result = await db
          .update(borrowingRecord)
          .set({ status: 'return_pending' })
          .where(eq(borrowingRecord.id, id))
          .returning();

        return c.json({ data: result[0] });
      } catch (error) {
        console.error('申请归还失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 管理员确认归还
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

        if (existing[0].status !== 'return_pending') {
          return c.json({ message: '只能确认归还申请中的借阅记录' }, 400);
        }

        const returnDate = new Date();
        const dueDate = existing[0].dueDate;
        let overdueDays = 0;

        // 借阅时间存在且晚于归还时间，计算逾期天数
        if (dueDate && returnDate > dueDate) {
          // getTime 单位是毫秒，逾期天数
          overdueDays = Math.ceil(
            (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
          );
        }

        const result = await db.transaction(async (tx) => {
          const returned = await tx
            .update(borrowingRecord)
            .set({ status: 'returned', returnDate, overdueDays })
            .where(eq(borrowingRecord.id, id))
            .returning();

          await tx
            .update(book)
            .set({
              availableStock: sql`${book.availableStock} + ${existing[0].quantity}`,
              status: 'available' as const,
            })
            .where(eq(book.ISBN, existing[0].ISBN));

          return returned[0];
        });

        return c.json({ data: result });
      } catch (error) {
        console.error('确认归还失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 查询自己的借阅记录
  .get(
    '/borrowings/my-records',
    requireAuth,
    zValidator('query', z.object({ userId: z.string() })),
    async (c) => {
      try {
        const { userId } = c.req.valid('query');

        // 关联查询，查询某个用户下的所有 book 信息
        const result = await db.query.borrowingRecord.findMany({
          where: eq(borrowingRecord.userId, userId),
          with: {
            book: true, // 自动关联查询 book 表
          },
        });

        return c.json({ data: result });
      } catch (error) {
        console.error('查询借阅记录失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  );

export default app;
