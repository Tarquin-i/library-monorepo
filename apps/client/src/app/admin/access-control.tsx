import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { client } from '@/lib/rpc';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AccessControl() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  // 获取用户列表和可用角色
  useEffect(() => {
    async function fetchData() {
      const [usersRes, rolesRes] = await Promise.all([
        client.api.v1.users.$get(),
        client.api.v1.roles.$get(),
      ]);
      const usersJson = await usersRes.json();
      const rolesJson = await rolesRes.json();
      setUsers(usersJson.data);
      setRoles(rolesJson.data);
    }
    fetchData();
  }, []);

  // 修改角色
  async function handleRoleChange(userId: string, newRole: string) {
    const res = await client.api.v1.users[':id'].role.$patch({
      param: { id: userId },
      json: { role: newRole },
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    );
    toast.success('角色修改成功');
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
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium'>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value: string) =>
                          handleRoleChange(user.id, value)
                        }
                      >
                        <SelectTrigger className='w-36'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
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
