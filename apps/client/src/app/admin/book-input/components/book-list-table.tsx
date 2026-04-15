import { useQuery } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { listBooksQuery } from '@/api/book.query';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// 从查询返回类型推断单本书籍类型
export type Book = Awaited<ReturnType<typeof listBooksQuery.queryFn>>[number];

export function BookListTable({
  searchTerm,
  onEdit,
  onDelete,
}: {
  searchTerm: string;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}) {
  const { data: books = [] } = useQuery(listBooksQuery);

  const filteredBooks = books.filter((book) => {
    const term = searchTerm.toLowerCase();
    return (
      book.bookName.toLowerCase().includes(term) ||
      book.ISBN.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term)
    );
  });

  // 图书状态中文映射
  function getBookStatusText(status: string) {
    switch (status) {
      case 'available':
        return '可借阅';
      case 'borrowed':
        return '已借出';
      case 'lost':
        return '已丢失';
      case 'scrapped':
        return '已销毁';
      default:
        return status;
    }
  }

  return (
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
          <TableHead className='text-right'>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredBooks.map((b) => (
          <TableRow key={b.ISBN}>
            <TableCell className='font-mono text-sm'>{b.ISBN}</TableCell>
            <TableCell className='font-medium'>{b.bookName}</TableCell>
            <TableCell>{b.author}</TableCell>
            <TableCell>{b.publisher}</TableCell>
            <TableCell>{b.category}</TableCell>
            <TableCell>¥{b.price}</TableCell>
            <TableCell>{b.totalStock}</TableCell>
            <TableCell>{b.availableStock}</TableCell>
            <TableCell>{getBookStatusText(b.status)}</TableCell>
            <TableCell className='text-right'>
              <div className='flex justify-end gap-2'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onEdit(b)}
                >
                  <Pencil className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onDelete(b)}
                >
                  <Trash2 className='h-4 w-4 text-destructive' />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
