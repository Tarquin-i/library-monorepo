import AccessControl from '@/app/admin/access-control/access-control';
import { roleCheck } from '@/lib/route-guard';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/access-control')({
  beforeLoad: async () => {
    // const session = await authClient.getSession();
    // console.log(session.data?.user?.role);
    // 路由守卫，传递当前页面所需的角色类型，检查用户是否具有访问权限
    await roleCheck(['admin', 'librarian', 'reader']);
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <AccessControl />
    </div>
  );
}
