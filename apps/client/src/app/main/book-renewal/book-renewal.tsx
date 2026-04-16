import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { myBorrowingRecordsQuery } from '@/api/borrowing.query';
import { applyRenewalMutation } from '@/api/renewal.query';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export default function BookRenewal() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? '';
  const queryClient = useQueryClient();

  const { data: records = [] } = useQuery(myBorrowingRecordsQuery(userId));

  // 只展示已批准（在借中）的记录
  const activeRecords = records.filter((r) => r.status === 'approved');

  const renewalMutation = useMutation({
    ...applyRenewalMutation,
    onSuccess: () => {
      toast.success('续借申请已提交，等待管理员审批');
      // 刷新借阅记录缓存
      queryClient.invalidateQueries({ queryKey: ['myBorrowings', userId] });
      // 刷新当前用户的续借记录
      queryClient.invalidateQueries({ queryKey: ['myRenewals', userId] });
      // 刷新管理员侧续借管理列表
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '续借申请失败');
    },
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
            <h1 className='text-2xl font-bold'>书籍续借</h1>
            <p className='text-muted-foreground mt-1'>
              对当前借阅中的书籍申请续借，每本书最多续借一次，续借 15 天
            </p>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>书名</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>应还日期</TableHead>
                  <TableHead>续借状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center text-muted-foreground py-8'
                    >
                      暂无续借记录
                    </TableCell>
                  </TableRow>
                )}
                {activeRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className='font-medium'>
                      {record.book.bookName}
                    </TableCell>
                    <TableCell>{record.book.author}</TableCell>
                    <TableCell className='font-mono text-sm'>
                      {record.ISBN}
                    </TableCell>
                    <TableCell>
                      {record.dueDate
                        ? String(record.dueDate).split('T')[0]
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.renewalCount > 0 ? (
                        <Badge variant='outline'>已续借</Badge>
                      ) : (
                        <Badge variant='secondary'>可续借</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.renewalCount === 0 ? (
                        <Button
                          size='sm'
                          onClick={() =>
                            renewalMutation.mutate({
                              borrowingId: record.id,
                              userId,
                            })
                          }
                        >
                          申请续借
                        </Button>
                      ) : (
                        <span className='text-sm text-muted-foreground'>
                          已达续借上限
                        </span>
                      )}
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
