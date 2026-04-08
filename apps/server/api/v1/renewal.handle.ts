import { db } from '@demo/db';
import { borrowingRecord } from '@demo/db/schema/borrowing.entity';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { renewalRecord } from '@demo/db/schema/renewal.entity';
import { requireRole } from '../../lib/permission';

const app = new Hono()
  .post(
    '/renewals/apply',
    zValidator(
      'json',
      z.object({
        borrowingId: z.number(),
        userId: z.string(),
      }),
    ),
    async (c) => {
      try {
        const { borrowingId, userId } = c.req.valid('json');

        // 查询借阅记录
        const borrowing = await db
          .select()
          .from(borrowingRecord)
          .where(eq(borrowingRecord.id, borrowingId));

        if (borrowing.length === 0) {
          return c.json({ message: '借阅记录不存在' }, 404);
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
            renewalDays: 15, //LINK 默认续借15天，这里不是前端传来的吗，而是固定的
          })
          .returning();

        return c.json({ data: result[0] }, 201);
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
    zValidator('json', z.object({ reviewerId: z.string() })),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const { reviewerId } = c.req.valid('json');

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
            status: 'approved',
            reviewerId,
          })
          .where(eq(renewalRecord.id, id))
          .returning();

        // 更新借阅记录的 dueDate 和 renewalCount
        await db
          .update(borrowingRecord)
          .set({
            dueDate: sql`${borrowingRecord.dueDate} + ${existing[0].renewalDays} * interval '1 day'`,
            renewalCount: sql`${borrowingRecord.renewalCount} + 1`,
          })
          .where(eq(borrowingRecord.id, existing[0].borrowingId));

        return c.json({ data: result[0] });
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
      z.object({ reviewerId: z.string(), rejectReason: z.string() }),
    ),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const { reviewerId, rejectReason } = c.req.valid('json');

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
            reviewerId,
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
