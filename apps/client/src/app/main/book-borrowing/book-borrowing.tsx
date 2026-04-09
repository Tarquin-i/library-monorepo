import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listBooksQuery } from '@/api/book.query';
import { applyBorrowingMutation } from '@/api/borrowing.query';
import { authClient } from '@/lib/better-auth';
import { toast } from 'sonner';

export default function BookBorrowing() {
  const { data: session } = authClient.useSession();
  const { data: books = [] } = useQuery(listBooksQuery);
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedISBN, setSelectedISBN] = useState<string | null>(null);

  const borrowMutation = useMutation({
    ...applyBorrowingMutation,
    onSuccess: () => {
      toast.success('借阅申请提交成功，等待管理员审批');
      // 刷新书籍列表，更新可借数量
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setDialogOpen(false);
      setSelectedISBN(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || '借阅申请失败');
    },
  });

  // 打开弹窗，记录选中的书籍ISBN
  const handleBorrowClick = (ISBN: string) => {
    setSelectedISBN(ISBN);
    setDialogOpen(true);
  };


  // 确认借阅，调用借阅申请接口
  const handleConfirmBorrow = () => {
    if (!selectedISBN || !session?.user?.id) return;

    borrowMutation.mutate({
      ISBN: selectedISBN,
      userId: session.user.id,
    });
  };

  // 判断书籍是否可借
  const isBookAvailable = (book: {
    availableStock: number;
    status: string;
  }) => {
    return book.availableStock > 0 && book.status === 'available';
  };

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
            <h1 className='text-2xl font-bold'>书籍借阅</h1>
            <p className='text-muted-foreground mt-1'>
              浏览可借阅的书籍，提交借阅申请
            </p>
          </div>

          <div className='mb-4'>
            <div className='relative max-w-sm'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input placeholder='搜索书籍...' className='pl-9' />
            </div>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>书名</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>可借数量</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.ISBN}>
                    <TableCell className='font-medium'>
                      {book.bookName}
                    </TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell className='font-mono text-sm'>
                      {book.ISBN}
                    </TableCell>
                    <TableCell>{book.availableStock}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Button
                          size='sm'
                          onClick={() => handleBorrowClick(book.ISBN)}
                          disabled={!isBookAvailable(book)}
                        >
                          借阅
                        </Button>
                        {isBookAvailable(book) ? (
                          <Badge variant='secondary'>可借</Badge>
                        ) : (
                          <Badge variant='outline'>已借完</Badge>
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

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认借阅</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要借阅这本书吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBorrow}>
              确认借阅
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
