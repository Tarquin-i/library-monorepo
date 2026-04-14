import type { AppType } from '@tarquin/server/index';
import { hc } from 'hono/client';

export const client = hc<AppType>('http://localhost:3100', {
  init: {
    credentials: 'include',
  },
}).api.v1;
