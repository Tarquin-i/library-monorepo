import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { listBooksQuery } from '@/api/book.query';
import { applyBorrowingMutation } from '@/api/borrowing.query';
import { AppSidebar } from '@/components/app-sidebar';
import { BookCoverPreview } from '@/components/book-cover-preview';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function BookBorrowing() {
  const { data: session } = authClient.useSession();
  const { data: books = [] } = useQuery(listBooksQuery);
  const queryClient = useQueryClient();

  // 搜索关键词
  const [searchTerm, setSearchTerm] = useState('');
  // 借阅弹窗开关
  const [dialogOpen, setDialogOpen] = useState(false);
  // 当前选中的书籍 ISBN
  const [selectedISBN, setSelectedISBN] = useState<string | null>(null);
  // 借阅数量
  const [quantity, setQuantity] = useState(1);
  // 借阅天数
  const [borrowDays, setBorrowDays] = useState(30);

  const borrowMutation = useMutation({
    ...applyBorrowingMutation,
    onSuccess: () => {
      toast.success('借阅申请提交成功，等待管理员审批');
      // 刷新书籍列表
      queryClient.invalidateQueries({ queryKey: ['books'] });
      // 刷新管理端借阅列表
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      if (session?.user?.id) {
        // 刷新当前用户的借阅记录
        queryClient.invalidateQueries({
          queryKey: ['myBorrowings', session.user.id],
        });
      }
      setDialogOpen(false);
      setSelectedISBN(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || '借阅申请失败');
    },
  });

  // 打开弹窗，记录选中的书籍ISBN，重置表单
  const handleBorrowClick = (ISBN: string) => {
    setSelectedISBN(ISBN);
    setQuantity(1);
    setBorrowDays(30);
    setDialogOpen(true);
  };

  // 确认借阅，调用借阅申请接口
  const handleConfirmBorrow = () => {
    if (!selectedISBN) return;
    borrowMutation.mutate({
      ISBN: selectedISBN,
      quantity,
      borrowDays,
    });
  };

  // 搜索过滤
  const filteredBooks = books.filter((book) => {
    const term = searchTerm.toLowerCase();
    return (
      book.bookName.toLowerCase().includes(term) ||
      book.ISBN.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term)
    );
  });

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
              <Input
                placeholder='搜索书籍...'
                className='pl-9'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>封面</TableHead>
                  <TableHead>书名</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>可借数量</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center text-muted-foreground py-8'
                    >
                      暂无图书记录
                    </TableCell>
                  </TableRow>
                )}
                {filteredBooks.map((book) => (
                  <TableRow key={book.ISBN}>
                    <TableCell className='w-16'>
                      {/* 自定义图书封面悬浮组件 */}
                      <BookCoverPreview
                        src={book.coverImage}
                        title={book.bookName}
                      />
                    </TableCell>
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
              请填写借阅信息后确认提交
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='flex items-center gap-4'>
              <Label className='w-20 text-right'>借阅数量</Label>
              <Input
                type='number'
                min={1}
                max={5}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className='w-24'
              />
              <span className='text-sm text-muted-foreground'>本</span>
            </div>
            <div className='flex items-center gap-4'>
              <Label className='w-20 text-right'>借阅天数</Label>
              <Input
                type='number'
                min={1}
                max={90}
                value={borrowDays}
                onChange={(e) => setBorrowDays(Number(e.target.value))}
                className='w-24'
              />
              <span className='text-sm text-muted-foreground'>天</span>
            </div>
          </div>
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
