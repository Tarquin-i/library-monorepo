import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listBooksQuery } from '@/api/book.query';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import { BookInputForm } from '@/components/book-input-form';

export default function BookInput() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: books = [] } = useQuery(listBooksQuery);

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
            <h1 className='text-2xl font-bold'>书籍录入</h1>
            <p className='text-muted-foreground mt-1'>
              管理图书馆书籍信息，录入新书籍
            </p>
          </div>

          <div className='mb-4 flex items-center gap-4'>
            <div className='relative flex-1 max-w-sm'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input placeholder='搜索书籍...' className='pl-9' />
            </div>
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              录入书籍
            </Button>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ISBN</TableHead>
                  <TableHead>书名</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>出版社</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>馆藏数量</TableHead>
                  <TableHead>可借数量</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((b) => (
                  <TableRow key={b.ISBN}>
                    <TableCell className='font-mono text-sm'>
                      {b.ISBN}
                    </TableCell>
                    <TableCell className='font-medium'>{b.bookName}</TableCell>
                    <TableCell>{b.author}</TableCell>
                    <TableCell>{b.publisher}</TableCell>
                    <TableCell>{b.category}</TableCell>
                    <TableCell>¥{b.price}</TableCell>
                    <TableCell>{b.totalStock}</TableCell>
                    <TableCell>{b.availableStock}</TableCell>
                    <TableCell>{b.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>

      <BookInputForm open={sheetOpen} onOpenChange={setSheetOpen} />
    </SidebarProvider>
  );
}
