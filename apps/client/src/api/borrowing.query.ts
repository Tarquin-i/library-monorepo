import { client } from '@/lib/rpc';
import type { InferRequestType } from 'hono/client';

type ApplyBorrowingInput = InferRequestType<
  typeof client.borrowings.apply.$post
>['json'];

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
