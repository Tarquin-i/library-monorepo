import { useState, useEffect } from 'react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  listBooksQuery,
  createBookMutation,
  type Book,
} from '@/api/book.query';
import { Search, Plus } from 'lucide-react';

export default function BookInput() {
  const [books, setBooks] = useState<Book[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formData, setFormData] = useState({
    ISBN: '',
    bookName: '',
    author: '',
    publisher: '',
    publishDate: '',
    category: '',
    price: '',
    totalStock: '',
    availableStock: '',
    description: '',
    coverImage: '',
  });

  async function fetchBooks() {
    const books = await listBooksQuery();
    setBooks(books);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: 挂载时请求一次
  useEffect(() => {
    fetchBooks();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await createBookMutation({
      ISBN: formData.ISBN,
      bookName: formData.bookName,
      author: formData.author,
      publisher: formData.publisher,
      publishDate: formData.publishDate,
      category: formData.category,
      price: Number(formData.price),
      totalStock: Number(formData.totalStock),
      availableStock: Number(formData.availableStock),
      description: formData.description || undefined,
      coverImage: formData.coverImage || undefined,
    });

    toast.success('书籍录入成功');
    setSheetOpen(false);

    // 清空表单
    setFormData({
      ISBN: '',
      bookName: '',
      author: '',
      publisher: '',
      publishDate: '',
      category: '',
      price: '',
      totalStock: '',
      availableStock: '',
      description: '',
      coverImage: '',
    });

    fetchBooks();
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>录入新书籍</SheetTitle>
            <SheetDescription>填写书籍信息</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className='space-y-4 px-4'>
            <div className='space-y-2'>
              <Label>ISBN</Label>
              <Input
                name='ISBN'
                placeholder='xxx-x-xxx-xxxxx-x'
                required
                value={formData.ISBN}
                onChange={(e) =>
                  setFormData({ ...formData, ISBN: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>书名</Label>
              <Input
                name='bookName'
                placeholder='请输入书名'
                required
                value={formData.bookName}
                onChange={(e) =>
                  setFormData({ ...formData, bookName: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>作者</Label>
              <Input
                name='author'
                placeholder='请输入作者'
                required
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>出版社</Label>
              <Input
                name='publisher'
                placeholder='请输入出版社'
                required
                value={formData.publisher}
                onChange={(e) =>
                  setFormData({ ...formData, publisher: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>出版日期</Label>
              <Input
                name='publishDate'
                placeholder='请输入出版日期'
                required
                value={formData.publishDate}
                onChange={(e) =>
                  setFormData({ ...formData, publishDate: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>分类</Label>
              <Input
                name='category'
                placeholder='请输入书籍类型'
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-2'>
                <Label>价格</Label>
                <Input
                  name='price'
                  type='number'
                  min={0}
                  step='0.01'
                  placeholder='0.00'
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>馆藏数量</Label>
                <Input
                  name='totalStock'
                  type='number'
                  min={0}
                  placeholder='1'
                  required
                  value={formData.totalStock}
                  onChange={(e) =>
                    setFormData({ ...formData, totalStock: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>可借数量</Label>
                <Input
                  name='availableStock'
                  type='number'
                  min={0}
                  placeholder='1'
                  required
                  value={formData.availableStock}
                  onChange={(e) =>
                    setFormData({ ...formData, availableStock: e.target.value })
                  }
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>简介</Label>
              <Input
                name='description'
                placeholder='图书简介（选填）'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>封面图片 URL</Label>
              <Input
                name='coverImage'
                placeholder='图片链接（选填）'
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
              />
            </div>
            <SheetFooter className='pt-4'>
              <Button type='submit'>确认录入</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
