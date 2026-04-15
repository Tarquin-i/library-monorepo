import { createFileRoute } from '@tanstack/react-router';
import BookInput from '@/app/admin/book-input/book-input';
import { roleCheck } from '@/lib/route-guard';

export const Route = createFileRoute('/book-input')({
  beforeLoad: async () => {
    // const session = await authClient.getSession();
    // console.log(session.data?.user?.role);
    // 路由守卫，传递当前页面所需的角色类型，检查用户是否具有访问权限
    await roleCheck(['admin', 'librarian']);
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <BookInput />
    </div>
  );
}
