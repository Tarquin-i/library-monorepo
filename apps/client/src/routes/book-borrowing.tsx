import { createFileRoute } from '@tanstack/react-router';
import { roleCheck } from '@/lib/route-guard';
import BookInput from '@/app/admin/book-input';

export const Route = createFileRoute('/book-borrowing')({
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
      <BookInput />
    </div>
  );
}
