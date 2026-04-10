import { client } from '@/lib/rpc';
import type { InferRequestType } from 'hono/client';

type ApplyBorrowingInput = InferRequestType<
  typeof client.borrowings.apply.$post
>['json'];

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
    const res = await client.borrowings['my-records'].$get({
      query: { userId },
    });
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
