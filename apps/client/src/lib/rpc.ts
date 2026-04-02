import { hc } from 'hono/client';
import type { AppType } from '@tarquin/server/index';

export const client = hc<AppType>('http://localhost:3100').api.v1;
