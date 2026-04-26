import { db } from '@demo/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

const betterAuthBaseUrl = process.env.BETTER_AUTH_URL?.trim();

if (!betterAuthBaseUrl) {
  throw new Error('BETTER_AUTH_URL 未配置。');
}

// 这里填的是浏览器会带过来的 Origin，不是后端接口地址。
export const trustedOrigins = [
  'http://localhost:3000',
  'http://brucebook.thq.huivodata.com',
];

export const auth = betterAuth({
  // better-auth 用它生成回调地址、校验自身基准地址。
  baseURL: betterAuthBaseUrl,
  // 这里校验的是浏览器来源，应该填前端站点 origin。
  trustedOrigins,
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
