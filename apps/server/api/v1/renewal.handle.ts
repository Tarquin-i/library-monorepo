import { db } from '@demo/db';
import { borrowingRecord } from '@demo/db/schema/borrowing.entity';
import {
  renewalRecord,
  renewalStatusEnum,
} from '@demo/db/schema/renewal.entity';
import { zValidator } from '@hono/zod-validator';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { getCurrentUser, requireAuth, requireRole } from '../../lib/permission';

const app = new Hono()
  // 读者查询自己的续借记录
  .get(
    '/renewals/my-records',
    requireAuth,
    async (c) => {
      try {
        const currentUser = getCurrentUser(c);
        if (!currentUser) {
          return c.json({ message: '未登录' }, 401);
        }

        // 先查出当前用户关联的借阅记录，再回查续借记录和图书信息
        const borrowings = await db
          .select()
          .from(borrowingRecord)
          .where(eq(borrowingRecord.userId, currentUser.id));

        if (borrowings.length === 0) {
          return c.json({ data: [] });
        }

        // 记录所有借阅记录 id
        const borrowingIds = borrowings.map((b) => b.id);
        const result = await db.query.renewalRecord.findMany({
          where: inArray(renewalRecord.borrowingId, borrowingIds),
          with: {
            borrowing: {
              with: {
                book: true,
              },
            },
          },
        });

        return c.json({ data: result });
      } catch (error) {
        console.error('查询续借记录失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 管理员查询续借记录
  .get(
    '/renewals',
    requireRole('admin', 'librarian'),
    zValidator(
      'query',
      z.object({
        status: z.enum(renewalStatusEnum.enumValues).optional(),
        borrowingId: z.string().transform(Number).optional(),
      }),
    ),
    async (c) => {
      try {
        const { status, borrowingId } = c.req.valid('query');

        const result = await db.query.renewalRecord.findMany({
          where: and(
            status ? eq(renewalRecord.status, status) : undefined,
            borrowingId
              ? eq(renewalRecord.borrowingId, borrowingId)
              : undefined,
          ),
          with: {
            borrowing: {
              with: {
                book: true,
              },
            },
          },
        });
        return c.json({ data: result });
      } catch (error) {
        console.error('查询续借记录失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 续借申请
  .post(
    '/renewals/apply',
    zValidator(
      'json',
      z.object({
        borrowingId: z.number(),
      }),
    ),
    async (c) => {
      try {
        const currentUser = getCurrentUser(c);
        if (!currentUser) {
          return c.json({ message: '未登录' }, 401);
        }

        const { borrowingId } = c.req.valid('json');

        // 查询借阅记录
        const borrowing = await db
          .select()
          .from(borrowingRecord)
          .where(eq(borrowingRecord.id, borrowingId));

        if (borrowing.length === 0) {
          return c.json({ message: '借阅记录不存在' }, 404);
        }

        if (borrowing[0].userId !== currentUser.id) {
          return c.json({ message: '只能为自己的借阅记录申请续借' }, 403);
        }

        // 检查是否可以续借
        if (borrowing[0].status !== 'approved') {
          return c.json({ message: '只能对已借出的书籍申请续借' }, 400);
        }

        // 检查是否逾期
        if (borrowing[0].dueDate && new Date() > borrowing[0].dueDate) {
          return c.json({ message: '无法续借，图书已逾期' }, 400);
        }

        // 检查是否已经续借过
        const existing = await db
          .select()
          .from(renewalRecord)
          .where(eq(renewalRecord.borrowingId, borrowingId));

        if (existing.length > 0) {
          return c.json({ message: '每本书只能续借一次' }, 400);
        }
        // 创建续借申请
        const result = await db
          .insert(renewalRecord)
          .values({
            borrowingId,
            status: 'pending',
          })
          .returning();

        return c.json({ data: result }, 201);
      } catch (error) {
        console.error('续借申请失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 管理员审核续借申请
  .patch(
    '/renewals/:id/approve',
    requireRole('admin', 'librarian'),
    zValidator('param', z.object({ id: z.string().transform(Number) })),
    async (c) => {
      try {
        const currentUser = getCurrentUser(c);
        if (!currentUser) {
          return c.json({ message: '未登录' }, 401);
        }

        const { id } = c.req.valid('param');

        const existing = await db
          .select()
          .from(renewalRecord)
          .where(eq(renewalRecord.id, id));

        if (existing.length === 0) {
          return c.json({ message: '续借记录不存在' }, 404);
        }

        if (existing[0].status !== 'pending') {
          return c.json({ message: '只能审批待审核的续借申请' }, 400);
        }

        const borrowing = await db
          .select()
          .from(borrowingRecord)
          .where(eq(borrowingRecord.id, existing[0].borrowingId));

        if (borrowing.length === 0) {
          return c.json({ message: '关联借阅记录不存在' }, 404);
        }

        if (borrowing[0].status !== 'approved') {
          return c.json({ message: '只能审批已借出的续借申请' }, 400);
        }

        if (!borrowing[0].dueDate) {
          return c.json({ message: '借阅记录缺少应还日期，无法审批续借' }, 400);
        }

        // 更新续借记录状态
        const result = await db.transaction(async (tx) => {
          const approved = await tx
            .update(renewalRecord)
            .set({
              status: 'approved',
              reviewerId: currentUser.id,
            })
            .where(eq(renewalRecord.id, id))
            .returning();

          // 更新借阅记录的还书日期和续借次数
          await tx
            .update(borrowingRecord)
            .set({
              dueDate: sql`${borrowingRecord.dueDate} + ${existing[0].renewalDays} * interval '1 day'`,
              renewalCount: sql`${borrowingRecord.renewalCount} + 1`,
            })
            .where(eq(borrowingRecord.id, existing[0].borrowingId));

          return approved[0];
        });

        return c.json({ data: result });
      } catch (error) {
        console.error('审批续借申请失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  )
  // 管理员拒绝续借申请
  .patch(
    '/renewals/:id/reject',
    requireRole('admin', 'librarian'),
    zValidator('param', z.object({ id: z.string().transform(Number) })),
    zValidator(
      'json',
      z.object({ rejectReason: z.string() }),
    ),
    async (c) => {
      try {
        const currentUser = getCurrentUser(c);
        if (!currentUser) {
          return c.json({ message: '未登录' }, 401);
        }

        const { id } = c.req.valid('param');
        const { rejectReason } = c.req.valid('json');

        const existing = await db
          .select()
          .from(renewalRecord)
          .where(eq(renewalRecord.id, id));

        if (existing.length === 0) {
          return c.json({ message: '续借记录不存在' }, 404);
        }
        if (existing[0].status !== 'pending') {
          return c.json({ message: '只能审批待审核的续借申请' }, 400);
        }

        // 更新续借记录状态
        const result = await db
          .update(renewalRecord)
          .set({
            status: 'rejected',
            reviewerId: currentUser.id,
            rejectReason,
          })
          .where(eq(renewalRecord.id, id))
          .returning();

        return c.json({ data: result[0] });
      } catch (error) {
        console.error('审批续借申请失败:', error);
        return c.json({ message: '服务器错误，请稍后重试' }, 500);
      }
    },
  );

export default app;
