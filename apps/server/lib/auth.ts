import { db } from '@demo/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

const trustedOrigins = [
  'http://localhost:3000',
  'http://brucebook.thq.huivodata.com',
];
const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim();

if (betterAuthUrl) {
  trustedOrigins.push(new URL(betterAuthUrl).origin);
}

export const auth = betterAuth({
  // 白名单来源走环境变量，别把线上域名写死在代码里。
  trustedOrigins: [...new Set(trustedOrigins)],
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
