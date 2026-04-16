import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { type Book, deleteBookMutation } from '@/api/book.query';
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

export function BookDeleteDialog({
  open,
  onOpenChange,
  book,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book;
}) {
  const queryClient = useQueryClient();

  const deleteBook = useMutation({
    ...deleteBookMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('书籍删除成功');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除书籍失败');
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除《{book.bookName}》（ISBN: {book.ISBN}
            ）吗？此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={() => book && deleteBook.mutate(book.ISBN)}
          >
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
