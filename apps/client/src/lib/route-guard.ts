import { redirect } from '@tanstack/react-router';
import { toast } from 'sonner';
import { authClient } from './better-auth';

export type Role = 'admin' | 'librarian' | 'reader';

export async function loginCheck() {
  const session = await authClient.getSession();
  if (!session.data) {
    // 用户未登录，重定向到登录页
    toast.error('请先登录以访问此页面。');
    throw redirect({
      to: '/login',
      search: {
        // 登录后返回当前页面
        redirect: location.href,
      },
    });
  }
  return session;
}

// 传入当前页面所需的角色类型，检查当前用户是否具有访问权限
export async function roleCheck(requiredRoles: Role[]) {
  const session = await loginCheck(); // 首先检查用户是否登录
  const userRole = session.data?.user?.role as Role | undefined;
  if (!userRole || !requiredRoles.includes(userRole)) {
    // 用户没有访问权限，重定向到主页或显示错误消息
    toast.error('您没有权限访问此页面。');
    throw redirect({ to: '/' });
  }
  return session;
}
