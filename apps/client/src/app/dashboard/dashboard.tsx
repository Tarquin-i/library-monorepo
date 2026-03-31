import { AppSidebar } from '@/components/app-sidebar';
import { SectionCards } from '@/components/section-cards';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function Dashboard() {
  // 从路由上下文中获取用户信息
  // const { user } = useRouteContext({ from: '__root__' });
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
        <div className='px-4 py-6 lg:px-8'>dashboard页面</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
