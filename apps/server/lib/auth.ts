import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@demo/db';

export const auth = betterAuth({
  // 给 better-auth 添加自己的地址信任校验（注：cors 是浏览器层面的安全机制）
  trustedOrigins: ['http://localhost:3000'],
  database: drizzleAdapter(db, {
    provider: 'pg', // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
    maxAge: 5 * 60, // 缓存 5 分钟，getSession 先走 Cookie 里面的缓存
  },
  // 在 better-auth 基础上加新字段，同步告知加了什么字段（不然里面只会用默认那几个字段
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'reader',
        // 不让用户注册的时候自己传值
        input: false,
      },
    },
  },
});
