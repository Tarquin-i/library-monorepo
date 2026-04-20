import type { AppType } from '@tarquin/server/index';
import { hc } from 'hono/client';
import { getServerBaseUrl } from './utils';

// RPC 与认证共用同一套服务端地址解析逻辑。
export const client = hc<AppType>(getServerBaseUrl(), {
  init: {
    credentials: 'include',
  },
}).api.v1;
