import { Hono } from 'hono';
import { db } from '@demo/db';
import { book } from '@demo/db/schema/book.entity';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';

// 录入书籍的参数校验
const createBookSchema = z.object({
  ISBN: z.string().min(1, 'ISBN 不能为空'),
  bookName: z.string().min(1, '书名不能为空'),
  author: z.string().min(1, '作者不能为空'),
  publisher: z.string().min(1, '出版社不能为空'),
  publishDate: z.string().min(1, '出版日期不能为空'),
  category: z.string().min(1, '分类不能为空'),
  price: z.number().positive('价格必须大于 0'),
  totalStock: z.number().int().min(1, '馆藏数量至少为 1'),
  availableStock: z.number().int().min(0, '可借阅数量不能为负'),
  description: z.string().optional(),
  coverImage: z.string().optional(),
});

const app = new Hono()
  // 获取书籍列表
  .get('/books', async (c) => {
    const result = await db.select().from(book);
    return c.json({ data: result });
  })
  // 录入书籍
  .post(
    '/books',
    zValidator('json', createBookSchema),
    async (c) => {
      const data = c.req.valid('json');

      const result = await db
        .insert(book)
        .values(data)
        .returning();

      return c.json({ data: result[0] }, 201);
    },
  );

export default app;
