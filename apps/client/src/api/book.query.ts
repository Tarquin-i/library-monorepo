import type { InferRequestType } from 'hono/client';
import { client } from '@/lib/rpc';

export type CreateBookInput = InferRequestType<
  typeof client.books.$post
>['json'];

export const listBooksQuery = {
  queryKey: ['books'],
  queryFn: async () => {
    const res = await client.books.$get();
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '获取书籍列表失败');
    }
    return json.data;
  },
};

// mutation 不能自动推到可以通过 InferRequestType 提取端点返回类型
export const createBookMutation = {
  mutationFn: async (bookData: CreateBookInput) => {
    const res = await client.books.$post({ json: bookData });
    const json = await res.json();

    if ('message' in json) {
      throw new Error(json.message || '录入书籍失败');
    }

    // 用状态码区分：201 新增，200 追加库存
    return { isUpdated: res.status === 200 };
  },
};
