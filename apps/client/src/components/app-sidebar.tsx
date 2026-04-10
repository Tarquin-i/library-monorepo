import * as React from 'react';

import { Link } from '@tanstack/react-router';
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
import {
  LayoutDashboardIcon,
  ListIcon,
  BookOpenCheckIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  CommandIcon,
} from 'lucide-react';
import { authClient } from '@/lib/better-auth';
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
      title: '我的借阅记录',
      url: '/borrowing-records',
      icon: <BookOpenCheckIcon />,
    },
    // {
    //   title: 'Analytics',
    //   url: '/2',
    //   icon: <ChartBarIcon />,
    // },
    // {
    //   title: 'Projects',
    //   url: '/3',
    //   icon: <FolderIcon />,
    // },
    // {
    //   title: 'Team',
    //   url: '/4',
    //   icon: <UsersIcon />,
    // },
  ],
  admin: [
    {
      name: '权限管理',
      url: '/access-control',
      icon: <DatabaseIcon />,
    },
    {
      name: '书籍录入',
      url: '/book-input',
      icon: <FileChartColumnIcon />,
    },
    // {
    //   name: 'Word Assistant',
    //   url: '/10',
    //   icon: <FileIcon />,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data } = authClient.useSession();
  const isAdmin = data?.user?.role === 'admin';

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
        {isAdmin && <NavAdmin items={navData.admin} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
