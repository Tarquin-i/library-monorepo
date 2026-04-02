import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { createBookMutation } from '@/api/book.query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BookFormData {
  ISBN: string;
  bookName: string;
  author: string;
  publisher: string;
  publishDate: string;
  category: string;
  price: string;
  totalStock: string;
  availableStock: string;
  description: string;
  coverImage: string;
}

const bookFormData: BookFormData = {
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
};

export function BookInputForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState<BookFormData>(bookFormData);
  const queryClient = useQueryClient();
  const createBook = useMutation({
    ...createBookMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    createBook.mutate(
      {
        ...formData,
        price: Number(formData.price),
        totalStock: Number(formData.totalStock),
        availableStock: Number(formData.availableStock),
        description: formData.description || undefined,
        coverImage: formData.coverImage || undefined,
      },
      {
        onSuccess: () => {
          toast.success('书籍录入成功');
          setFormData(bookFormData);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
            <Button type='submit' disabled={createBook.isPending}>
              {createBook.isPending ? '提交中...' : '确认录入'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
