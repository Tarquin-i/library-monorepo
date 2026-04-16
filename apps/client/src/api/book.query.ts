import type { InferRequestType, InferResponseType } from 'hono/client';
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

// 后端传出的类型
export type Book = InferResponseType<
  typeof client.books.$get,
  200
>['data'][number];

// mutation 的入参可以通过 InferRequestType 提取请求体类型
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

export type UpdateBookInput = InferRequestType<
  (typeof client.books)[':isbn']['$patch']
>['json'];

export const updateBookMutation = {
  mutationFn: async ({
    isbn,
    data,
  }: {
    isbn: string;
    data: UpdateBookInput;
  }) => {
    const res = await client.books[':isbn'].$patch({
      param: { isbn },
      json: data,
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '修改书籍失败');
    }
    return json.data;
  },
};

export const deleteBookMutation = {
  mutationFn: async (isbn: string) => {
    const res = await client.books[':isbn'].$delete({
      param: { isbn },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '删除书籍失败');
    }
    return json.data;
  },
};
