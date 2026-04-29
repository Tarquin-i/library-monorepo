import {
  adminAccessControl,
  adminPluginRoles,
} from '@tarquin/db/better-auth/plugins/admin';
import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  /** 空字符串表示请求当前站点同源 /api，由开发代理或生产前端函数转发。 */
  baseURL: '',
  plugins: [
    adminClient({
      ac: adminAccessControl,
      roles: adminPluginRoles,
    }),
  ],
});
