import type { InferRequestType } from 'hono/client';
import { client } from '@/lib/rpc';

// 获取枚举类型
export type RenewalsQuery = InferRequestType<
  typeof client.renewals.$get
>['query']['status'];

// 读者申请续借
export const applyRenewalMutation = {
  mutationFn: async ({ borrowingId }: { borrowingId: number }) => {
    const res = await client.renewals.apply.$post({
      json: { borrowingId },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '续借申请失败');
    }
    return json.data;
  },
};

// 读者查询自己的续借记录
export const myRenewalsQuery = (userId: string) => ({
  queryKey: ['myRenewals', userId],
  queryFn: async () => {
    const res = await client.renewals['my-records'].$get();
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '获取续借记录失败');
    }
    return json.data;
  },
  enabled: !!userId,
});

// 管理员获取续借申请列表
export const listRenewalsQuery = (status?: RenewalsQuery) => ({
  queryKey: ['renewals', status],
  queryFn: async () => {
    const res = await client.renewals.$get({
      query: { status },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '获取续借列表失败');
    }
    return json.data;
  },
});

// 管理员批准续借申请
export const approveRenewalMutation = {
  mutationFn: async ({ id }: { id: number }) => {
    const res = await client.renewals[':id'].approve.$patch({
      param: { id: String(id) },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '批准续借失败');
    }
    return json.data;
  },
};

// 管理员拒绝续借申请
export const rejectRenewalMutation = {
  mutationFn: async ({
    id,
    rejectReason,
  }: {
    id: number;
    rejectReason: string;
  }) => {
    const res = await client.renewals[':id'].reject.$patch({
      param: { id: String(id) },
      json: { rejectReason },
    });
    const json = await res.json();
    if ('message' in json) {
      throw new Error(json.message || '拒绝续借失败');
    }
    return json.data;
  },
};
