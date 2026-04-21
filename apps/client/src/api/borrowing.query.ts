import type { InferRequestType } from 'hono/client';
import { client } from '@/lib/rpc';

type ApplyBorrowingInput = InferRequestType<
  typeof client.borrowings.apply.$post
>['json'];

export type BorrowingsQuery = InferRequestType<
  typeof client.borrowings.$get
>['query']['status'];

// 发起借书申请
export const applyBorrowingMutation = {
  mutationFn: async (data: ApplyBorrowingInput) => {
    const res = await client.borrowings.apply.$post({ json: data });
    const json = await res.json();
    // console.log('res--------------', res);
    // console.log('json--------------', json);
    if ('message' in json) {
      throw new Error(json.message || '借书申请失败');
    }
    return json.data;
  },
};

// 获取借阅记录
export const myBorrowingRecordsQuery = (userId: string) => ({
  queryKey: ['myBorrowings', userId],
  queryFn: async () => {
    const res = await client.borrowings['my-records'].$get();
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '获取借阅记录失败');
    }
    return json.data;
  },
  // 判断输入参数不能为空，避免发出无效请求和产生没必要缓存
  enabled: !!userId,
});

// 用户取消申请图书
export const cancelBorrowingMutation = {
  mutationFn: async (id: number) => {
    const res = await client.borrowings[':id'].cancel.$patch({
      param: { id: String(id) },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '取消申请失败');
    }
    return json.data;
  },
};

// 读者申请归还
export const requestReturnMutation = {
  mutationFn: async (id: number) => {
    const res = await client.borrowings[':id']['request-return'].$patch({
      param: { id: String(id) },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '申请归还失败');
    }
    return json.data;
  },
};

// 管理员获取借阅申请列表
export const listBorrowingsQuery = (status?: BorrowingsQuery) => ({
  queryKey: ['borrowings', status],
  queryFn: async () => {
    const res = await client.borrowings.$get({
      query: { status },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '获取借阅列表失败');
    }
    console.log('12346789', json.data);
    return json.data;
  },
});

// 管理员批准借阅申请
export const approveBorrowingMutation = {
  mutationFn: async ({ id }: { id: number }) => {
    const res = await client.borrowings[':id'].approve.$patch({
      param: { id: String(id) },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '审批失败');
    }
    return json.data;
  },
};

// 管理员拒绝借阅申请
export const rejectBorrowingMutation = {
  mutationFn: async ({
    id,
    rejectReason,
  }: {
    id: number;
    rejectReason: string;
  }) => {
    const res = await client.borrowings[':id'].reject.$patch({
      param: { id: String(id) },
      json: { rejectReason },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '拒绝失败');
    }
    return json.data;
  },
};

// 管理员办理归还书籍
export const returnBorrowingMutation = {
  mutationFn: async (id: number) => {
    const res = await client.borrowings[':id'].return.$patch({
      param: { id: String(id) },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '归还书籍失败');
    }
    return json.data;
  },
};
