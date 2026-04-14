import { useQuery } from '@tanstack/react-query';
import { listBooksQuery } from '@/api/book.query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function BookListTable() {
  const { data: books = [] } = useQuery(listBooksQuery);
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {books.map((b) => (
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
