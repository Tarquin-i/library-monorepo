import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  type AuthRole,
  listUsersQuery,
  updateUserRoleMutation,
} from '@/api/user.query';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { authClient } from '@/lib/better-auth';

const roleOptions = ['admin', 'librarian', 'reader'];

export default function AccessControl() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: users = [] } = useQuery(listUsersQuery);
  const currentUserId = session?.user.id;

  const updateRole = useMutation({
    ...updateUserRoleMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('角色修改成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '角色修改失败');
    },
  });

  function handleRoleChange(userId: string, newRole: AuthRole) {
    updateRole.mutate({ userId, newRole });
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant='inset' />
      <SidebarInset>
        <SiteHeader />
        <div className='px-4 py-6 lg:px-8'>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold'>权限管理</h1>
            <p className='text-muted-foreground mt-1'>
              管理系统用户的角色和访问权限
            </p>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>当前角色</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className='text-center text-muted-foreground py-8'
                    >
                      暂无用户信息
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium'>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        disabled={user.id === currentUserId}
                        onValueChange={(value: string) =>
                          handleRoleChange(user.id, value as AuthRole)
                        }
                      >
                        <SelectTrigger className='w-36'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
