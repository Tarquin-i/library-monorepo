import { useQuery } from '@tanstack/react-query';
import { myRenewalsQuery } from '@/api/renewal.query';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
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

export default function RenewalRecords() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';

  const { data: renewals = [] } = useQuery(myRenewalsQuery(userId));

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant='secondary'>待审核</Badge>;
      case 'approved':
        return <Badge>已批准</Badge>;
      case 'rejected':
        return <Badge variant='destructive'>已拒绝</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
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
            <h1 className='text-2xl font-bold'>续借记录</h1>
            <p className='text-muted-foreground mt-1'>查看你的续借申请状态</p>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>借阅记录ID</TableHead>
                  <TableHead>续借天数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请日期</TableHead>
                  <TableHead>拒绝原因</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renewals.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center text-muted-foreground py-8'
                    >
                      暂无续借记录
                    </TableCell>
                  </TableRow>
                )}
                {renewals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.borrowingId}</TableCell>
                    <TableCell>{r.renewalDays} 天</TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell>{String(r.createdAt).split('T')[0]}</TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {r.rejectReason ?? '-'}
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
