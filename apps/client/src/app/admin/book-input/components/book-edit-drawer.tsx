import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  type Book,
  type UpdateBookInput,
  updateBookMutation,
} from '@/api/book.query';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function BookEditDrawer({
  open,
  onOpenChange,
  book,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book;
}) {
  const [formData, setFormData] = useState<UpdateBookInput>({});
  const queryClient = useQueryClient();

  // 编辑的书籍变更时，用当前书籍数据填充表单
  useEffect(() => {
    setFormData({
      bookName: book.bookName,
      author: book.author,
      publisher: book.publisher,
      publishDate: book.publishDate,
      category: book.category,
      price: book.price,
      totalStock: book.totalStock,
      availableStock: book.availableStock,
      description: book.description ?? '',
      coverImage: book.coverImage ?? '',
      status: book.status,
    });
  }, [book]);

  const updateBook = useMutation({
    ...updateBookMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateBook.mutate(
      { isbn: book.ISBN, data: formData },
      {
        onSuccess: () => {
          toast.success('书籍信息修改成功');
          onOpenChange(false);
        },
        onError: (error: Error) => {
          toast.error(error.message || '修改书籍失败');
        },
      },
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction='right'>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>编辑书籍</DrawerTitle>
          <DrawerDescription>
            修改书籍信息（ISBN: {book.ISBN}）
          </DrawerDescription>
        </DrawerHeader>
        <form
          onSubmit={handleSubmit}
          className='space-y-4 overflow-y-auto px-4'
        >
          <div className='space-y-2'>
            <Label>ISBN</Label>
            <Input value={book.ISBN} disabled />
          </div>
          <div className='space-y-2'>
            <Label>书名</Label>
            <Input
              value={formData.bookName}
              onChange={(e) =>
                setFormData({ ...formData, bookName: e.target.value })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>作者</Label>
            <Input
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>出版社</Label>
            <Input
              value={formData.publisher}
              onChange={(e) =>
                setFormData({ ...formData, publisher: e.target.value })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>出版日期</Label>
            <Input
              value={formData.publishDate}
              onChange={(e) =>
                setFormData({ ...formData, publishDate: e.target.value })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>分类</Label>
            <Input
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
                type='number'
                min={0}
                step='0.01'
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.valueAsNumber })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>馆藏数量</Label>
              <Input
                type='number'
                min={0}
                value={formData.totalStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalStock: e.target.valueAsNumber,
                  })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>可借数量</Label>
              <Input
                type='number'
                min={0}
                value={formData.availableStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availableStock: e.target.valueAsNumber,
                  })
                }
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label>简介</Label>
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>封面图片 URL</Label>
            <Input
              value={formData.coverImage}
              onChange={(e) =>
                setFormData({ ...formData, coverImage: e.target.value })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>状态</Label>
            <Select
              value={formData.status}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  // 抽取字符 status 字段的类型作为传入的类型
                  status: val as UpdateBookInput['status'],
                })
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='available'>可借阅</SelectItem>
                <SelectItem value='borrowed'>已借出</SelectItem>
                <SelectItem value='lost'>已丢失</SelectItem>
                <SelectItem value='scrapped'>已销毁</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DrawerFooter className='pt-4'>
            <Button type='submit'>保存修改</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
