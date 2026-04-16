import { Link } from '@tanstack/react-router';
import {
  BookOpenCheckIcon,
  ClipboardListIcon,
  CommandIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  ListIcon,
  RefreshCwIcon,
} from 'lucide-react';
import type * as React from 'react';
import { NavAdmin } from '@/components/nav-admin';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/better-auth';
import type { Role } from '@/lib/route-guard';

const navData = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: <LayoutDashboardIcon />,
    },
    {
      title: '书籍借阅',
      url: '/book-borrowing',
      icon: <ListIcon />,
    },
    {
      title: '借阅记录',
      url: '/borrowing-records',
      icon: <BookOpenCheckIcon />,
    },
    {
      title: '书籍续借',
      url: '/book-renewal',
      icon: <RefreshCwIcon />,
    },
    {
      title: '续借记录',
      url: '/renewal-records',
      icon: <HistoryIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data } = authClient.useSession();
  const role = (data?.user as { role?: Role } | undefined)?.role;
  const isAdmin = role === 'admin';
  const isStaff = isAdmin || role === 'librarian';

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className='data-[slot=sidebar-menu-button]:p-1.5!'
            >
              <Link to='/' className='flex items-center gap-2'>
                <CommandIcon className='size-5!' />
                <span className='text-base font-semibold'>图书管理系统</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        {isStaff && (
          <NavAdmin
            label='图书管理员'
            items={[
              {
                name: '书籍录入',
                url: '/book-input',
                icon: <FileChartColumnIcon />,
              },
              {
                name: '借阅管理',
                url: '/borrowing-management',
                icon: <ClipboardListIcon />,
              },
              {
                name: '续借管理',
                url: '/renewal-management',
                icon: <RefreshCwIcon />,
              },
            ]}
          />
        )}
        {isAdmin && (
          <NavAdmin
            label='Admin'
            items={[
              {
                name: '权限管理',
                url: '/access-control',
                icon: <DatabaseIcon />,
              },
            ]}
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
