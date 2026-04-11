import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  myBorrowingRecordsQuery,
  cancelBorrowingMutation,
  requestReturnMutation,
} from '@/api/borrowing.query';
import { applyRenewalMutation } from '@/api/renewal.query';
import { authClient } from '@/lib/better-auth';
import { toast } from 'sonner';

export default function BorrowingRecords() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';
  const queryClient = useQueryClient();

  const { data: records = [] } = useQuery(myBorrowingRecordsQuery(userId));

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant='secondary'>待审核</Badge>;
      case 'approved':
        return <Badge>已批准</Badge>;
      case 'rejected':
        return <Badge variant='destructive'>已拒绝</Badge>;
      case 'cancelled':
        return <Badge variant='outline'>已取消</Badge>;
      case 'return_pending':
        return <Badge variant='secondary'>归还审核中</Badge>;
      case 'returned':
        return <Badge variant='outline'>已归还</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  }

  const cancelMut = useMutation({
    ...cancelBorrowingMutation,
    onSuccess: () => {
      toast.success('借阅申请已取消');
      queryClient.invalidateQueries({ queryKey: ['myBorrowings', userId] });
    },
    onError: (error: Error) => toast.error(error.message || '取消失败'),
  });

  const requestReturnMut = useMutation({
    ...requestReturnMutation,
    onSuccess: () => {
      toast.success('归还申请已提交，等待管理员确认');
      queryClient.invalidateQueries({ queryKey: ['myBorrowings', userId] });
    },
    onError: (error: Error) => toast.error(error.message || '申请归还失败'),
  });

  const renewalMutation = useMutation({
    ...applyRenewalMutation,
    onSuccess: () => {
      toast.success('续借申请已提交，等待管理员审批');
      queryClient.invalidateQueries({ queryKey: ['myBorrowings', userId] });
    },
    onError: (error: Error) => toast.error(error.message || '续借申请失败'),
  });

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
            <h1 className='text-2xl font-bold'>我的借阅记录</h1>
            <p className='text-muted-foreground mt-1'>
              查看你的借阅历史和当前状态
            </p>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>书名</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请日期</TableHead>
                  <TableHead>应还日期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className='font-medium'>
                      {record.book.bookName}
                    </TableCell>
                    <TableCell>{record.book.author}</TableCell>
                    <TableCell className='font-mono text-sm'>
                      {record.ISBN}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      {String(record.createdAt).split('T')[0]}
                    </TableCell>
                    <TableCell>
                      {record.dueDate
                        ? String(record.dueDate).split('T')[0]
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {record.status === 'pending' && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => cancelMut.mutate(record.id)}
                            disabled={cancelMut.isPending}
                          >
                            取消申请
                          </Button>
                        )}
                        {record.status === 'approved' && (
                          <>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => requestReturnMut.mutate(record.id)}
                              disabled={requestReturnMut.isPending}
                            >
                              申请归还
                            </Button>
                            {record.renewalCount === 0 && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  renewalMutation.mutate({
                                    borrowingId: record.id,
                                    userId,
                                  })
                                }
                              >
                                申请续借
                              </Button>
                            )}
                          </>
                        )}
                      </div>
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
