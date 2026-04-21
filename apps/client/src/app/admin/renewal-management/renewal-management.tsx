import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import type { RenewalsQuery } from '@/api/renewal.query';
import {
  approveRenewalMutation,
  listRenewalsQuery,
  rejectRenewalMutation,
} from '@/api/renewal.query';
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

export default function RenewalManagement() {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<RenewalsQuery>(undefined);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    id: number | null;
  }>({
    open: false,
    id: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  const { data: renewals = [] } = useQuery(listRenewalsQuery(status));

  // undefined 映射成 'all' 筛选全部
  function handleStatusChange(value: string) {
    setStatus(value === 'all' ? undefined : (value as RenewalsQuery));
  }

  function getStatusBadge(s: string) {
    switch (s) {
      case 'pending':
        return <Badge variant='secondary'>待审核</Badge>;
      case 'approved':
        return <Badge>已批准</Badge>;
      case 'rejected':
        return <Badge variant='destructive'>已拒绝</Badge>;
      default:
        return <Badge variant='outline'>{s}</Badge>;
    }
  }

  const approveMutation = useMutation({
    ...approveRenewalMutation,
    onSuccess: () => {
      toast.success('续借申请已批准');
      // 刷新续借管理列表
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      // 刷新用户自己的续借记录
      queryClient.invalidateQueries({ queryKey: ['myRenewals'] });
      // 刷新借阅记录缓存
      queryClient.invalidateQueries({ queryKey: ['myBorrowings'] });
    },
    onError: (error: Error) => toast.error(error.message || '批准失败'),
  });

  const rejectMutation = useMutation({
    ...rejectRenewalMutation,
    onSuccess: () => {
      toast.success('续借申请已拒绝');
      setRejectDialog({ open: false, id: null });
      setRejectReason('');
      // 刷新续借管理列表
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      // 刷新用户自己的续借记录
      queryClient.invalidateQueries({ queryKey: ['myRenewals'] });
      // 刷新借阅记录缓存
      queryClient.invalidateQueries({ queryKey: ['myBorrowings'] });
    },
    onError: (error: Error) => toast.error(error.message || '拒绝失败'),
  });

  function handleRejectConfirm() {
    if (!rejectDialog.id || !rejectReason.trim()) return;
    rejectMutation.mutate({
      id: rejectDialog.id,
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
            <h1 className='text-2xl font-bold'>续借管理</h1>
            <p className='text-muted-foreground mt-1'>审核读者的续借申请</p>
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
              </SelectContent>
            </Select>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>书名</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>续借天数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renewals.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className='text-center text-muted-foreground py-8'
                    >
                      暂无续借记录
                    </TableCell>
                  </TableRow>
                )}
                {renewals.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.id}</TableCell>
                    <TableCell className='font-medium'>
                      {record.borrowing?.book?.bookName}
                    </TableCell>
                    <TableCell className='font-mono text-sm'>
                      {record.borrowing?.ISBN}
                    </TableCell>
                    <TableCell>{record.renewalDays} 天</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      {String(record.createdAt).split('T')[0]}
                    </TableCell>
                    <TableCell>
                      {record.status === 'pending' && (
                        <div className='flex items-center gap-2'>
                          <Button
                            size='sm'
                            onClick={() =>
                              approveMutation.mutate({
                                id: record.id,
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
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>

      <AlertDialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog({ open, id: rejectDialog.id })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>拒绝续借申请</AlertDialogTitle>
            <AlertDialogDescription>
              请填写拒绝原因，该原因将记录在续借记录中。
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
