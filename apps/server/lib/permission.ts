import type { Context, Next } from 'hono';
import { auth } from './auth';

// 检查是否登录
export const requireAuth = async (c: Context, next: Next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ message: '未登录' }, 401);
  }

  // 挂到 hono 的请求上下文，后续可以通过 c.get('user') 获取到用户信息
  c.set('user', session.user);

  await next();
};

// 检查角色
export const requireRole = (...roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ message: '未登录' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ message: '没有权限访问' }, 403);
    }

    await next();
  };
};
