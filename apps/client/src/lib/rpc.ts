import type { AppType } from '@tarquin/server/index';
import { hc } from 'hono/client';

// 空字符串表示请求当前站点同源 /api，由开发代理或生产前端函数转发。
export const client = hc<AppType>('', {
  init: {
    credentials: 'include',
  },
}).api.v1;
