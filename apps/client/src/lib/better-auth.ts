import {
  adminAccessControl,
  adminPluginRoles,
} from '@demo/db/better-auth/plugins/admin';
import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { getServerBaseUrl } from './utils';

export const authClient = createAuthClient({
  /** 认证请求和 RPC 保持同一服务端地址。 */
  baseURL: getServerBaseUrl(),
  plugins: [
    adminClient({
      ac: adminAccessControl,
      roles: adminPluginRoles,
    }),
  ],
});
