import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import type { BorrowingsQuery } from '@/api/borrowing.query';
import {
  approveBorrowingMutation,
  listBorrowingsQuery,
  rejectBorrowingMutation,
  returnBorrowingMutation,
} from '@/api/borrowing.query';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export default function BorrowingManagement() {
  const { data: session } = authClient.useSession();
  const reviewerId = session?.user?.id ?? ''; // 当前用户 id
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<BorrowingsQuery>(undefined);
  const [rejectDialog, setRejectDialog] = useState<{
    // 拒绝弹窗以及收集记录
    open: boolean;
    id: number | null;
  }>({
    open: false,
    id: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  const { data: borrowings = [] } = useQuery(listBorrowingsQuery(status)); // 按状态查询

  // undefined 映射成 'all' 筛选全部
  function handleStatusChange(value: string) {
    setStatus(value === 'all' ? undefined : (value as BorrowingsQuery));
  }

  function getStatusBadge(s: string) {
    switch (s) {
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
        return <Badge variant='outline'>{s}</Badge>;
    }
  }

  const approveMutation = useMutation({
    ...approveBorrowingMutation,
    onSuccess: () => {
      toast.success('借阅申请已批准');
      // 刷新借阅管理列表
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      // 刷新书籍列表
      queryClient.invalidateQueries({ queryKey: ['books'] });
      // 刷新读者借阅记录
      queryClient.invalidateQueries({ queryKey: ['myBorrowings'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '审批失败');
    },
  });

  const rejectMutation = useMutation({
    ...rejectBorrowingMutation,
    onSuccess: () => {
      toast.success('借阅申请已拒绝');
      setRejectDialog({ open: false, id: null });
      setRejectReason('');
      // 刷新借阅管理列表
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      // 刷新读者借阅记录
      queryClient.invalidateQueries({ queryKey: ['myBorrowings'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '拒绝失败');
    },
  });

  const returnMutation = useMutation({
    ...returnBorrowingMutation,
    onSuccess: () => {
      toast.success('归还办理成功');
      // 刷新借阅管理列表
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      // 刷新书籍列表
      queryClient.invalidateQueries({ queryKey: ['books'] });
      // 刷新读者借阅记录
      queryClient.invalidateQueries({ queryKey: ['myBorrowings'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '归还失败');
    },
  });

  function handleRejectConfirm() {
    if (!rejectDialog.id || !rejectReason.trim())
      return toast.error('请填写拒绝原因');
    rejectMutation.mutate({
      id: rejectDialog.id,
      reviewerId,
      rejectReason: rejectReason.trim(),
    });
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
            <h1 className='text-2xl font-bold'>借阅管理</h1>
            <p className='text-muted-foreground mt-1'>审核借阅申请，办理归还</p>
          </div>

          <div className='mb-4'>
            {/* 上传 undefined 的话直接转换为 'all'（undefined 为筛选全部） */}
            <Select value={status ?? 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='状态筛选' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部</SelectItem>
                <SelectItem value='pending'>待审核</SelectItem>
                <SelectItem value='approved'>已批准</SelectItem>
                <SelectItem value='rejected'>已拒绝</SelectItem>
                <SelectItem value='returned'>已归还</SelectItem>
                <SelectItem value='cancelled'>已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>借阅天数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead>到期时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrowings.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.id}</TableCell>
                    <TableCell className='max-w-28 truncate'>
                      {record.user.name}
                    </TableCell>
                    <TableCell className='font-mono text-sm'>
                      {record.ISBN}
                    </TableCell>
                    <TableCell>{record.quantity}</TableCell>
                    <TableCell>{record.borrowDays} 天</TableCell>
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
                          <>
                            <Button
                              size='sm'
                              onClick={() =>
                                approveMutation.mutate({
                                  id: record.id,
                                  reviewerId,
                                })
                              }
                            >
                              批准
                            </Button>
                            <Button
                              size='sm'
                              variant='destructive'
                              onClick={() => {
                                setRejectDialog({ open: true, id: record.id });
                                setRejectReason('');
                              }}
                            >
                              拒绝
                            </Button>
                          </>
                        )}
                        {record.status === 'return_pending' && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => returnMutation.mutate(record.id)}
                          >
                            确认归还
                          </Button>
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

      {/* 拒绝原因弹窗 */}
      <AlertDialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog({ open, id: rejectDialog.id })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>拒绝借阅申请</AlertDialogTitle>
            <AlertDialogDescription>
              请填写拒绝原因，该原因将记录在借阅记录中。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            className='w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none min-h-20'
            placeholder='请输入拒绝原因...'
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectConfirm}>
              确认拒绝
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
