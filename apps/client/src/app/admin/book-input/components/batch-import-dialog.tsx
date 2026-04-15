import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { type CreateBookInput, createBookMutation } from '@/api/book.query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Excel 中文列名和后端 API 字段名映射表
const columnMap: Record<string, string> = {
  ISBN: 'ISBN',
  书名: 'bookName',
  作者: 'author',
  出版社: 'publisher',
  出版日期: 'publishDate',
  分类: 'category',
  价格: 'price',
  馆藏数量: 'totalStock',
  可借数量: 'availableStock',
  简介: 'description',
  封面图片URL: 'coverImage',
};

// 必填字段
const requiredFields = [
  'ISBN',
  'bookName',
  'author',
  'publisher',
  'publishDate',
  'category',
  'price',
  'totalStock',
  'availableStock',
];

// 校验单行数据，返回错误原因（无错误则返回 null）
function validateRow(
  row: Record<string, unknown>,
): { data: CreateBookInput; error: null } | { data: null; error: string } {
  // 过滤缺失字段名的数组，0 会误判成缺失词（排除）
  const missing = requiredFields.filter((f) => !row[f] && row[f] !== 0);
  if (missing.length > 0)
    return { data: null, error: `缺少必填字段：${missing.join('、')}` };

  // 吧 excel 里面读出来的数据强制转换成数字
  const price = Number(row.price);
  const totalStock = Number(row.totalStock);
  const availableStock = Number(row.availableStock);

  if (Number.isNaN(price) || price <= 0)
    return { data: null, error: '价格必须为正数' };
  if (!Number.isInteger(totalStock) || totalStock < 1)
    return { data: null, error: '馆藏数量必须为正整数' };
  if (!Number.isInteger(availableStock) || availableStock < 0)
    return { data: null, error: '可借数量不能为负数' };
  if (availableStock > totalStock)
    return { data: null, error: '可借数量不能大于馆藏数量' };

  return {
    data: {
      ISBN: String(row.ISBN),
      bookName: String(row.bookName),
      author: String(row.author),
      publisher: String(row.publisher),
      publishDate: String(row.publishDate),
      category: String(row.category),
      price,
      totalStock,
      availableStock,
      description: row.description ? String(row.description) : undefined,
      coverImage: row.coverImage ? String(row.coverImage) : undefined,
    },
    error: null,
  };
}

// 前端动态生成模板 xlsx 并下载
function downloadTemplate() {
  const example = [
    '978-7-111-64095-8',
    '代码整洁之道',
    'Robert C. Martin',
    '机械工业出版社',
    '2020-01-01',
    '计算机',
    59.9,
    5,
    5,
    '写出清晰可读的代码',
    '',
  ];
  // 取 keys 作为表头
  const headers = Object.keys(columnMap);
  // 二维数组插入数据，得到一个类似表格的二维数组
  const ws = XLSX.utils.aoa_to_sheet([
    headers, // 第一行表头
    example, // 第二行数据
  ]);
  // 创建一个 excel 文件
  const wb = XLSX.utils.book_new();
  // 把数据插入 excel 文件
  XLSX.utils.book_append_sheet(wb, ws, '书籍信息');
  // 导出文件（浏览器下载这个文件，并且命名为 书籍批量导入模板.xlsx ）
  XLSX.writeFile(wb, '书籍批量导入模板.xlsx');
}

export function BatchImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // 存储传进来的 xlsx 文件
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const createBook = useMutation({
    ...createBookMutation,
  });

  async function handleImport() {
    if (!file) return;

    // 把文件内容转换成二进制数据
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    // 获取表格中的第一张表
    const ws = wb.Sheets[wb.SheetNames[0]];
    // 吧文件里面的每一行(除了表头)对应成一个数组对象进行存储
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    // 创建新数组对象，把中文 key 换成英文名 key
    const rows = rawRows.map((raw) => ({
      ISBN: raw.ISBN,
      bookName: raw.书名,
      author: raw.作者,
      publisher: raw.出版社,
      publishDate: raw.出版日期,
      category: raw.分类,
      price: raw.价格,
      totalStock: raw.馆藏数量,
      availableStock: raw.可借数量,
      description: raw.简介,
      coverImage: raw.封面图片URL,
    }));

    if (rows.length === 0) {
      toast.error('Excel 文件中没有数据');
      return;
    }

    // 成功和失败的行数
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < rows.length; i++) {
      // 吧表格中获取的数据进行校验，获得校验过的函数
      const validated = validateRow(rows[i]);

      // 非法数据跳过当前循环
      if (!validated.data) {
        failureCount++;
        continue;
      }

      const bookData = validated.data;

      try {
        await createBook.mutateAsync(bookData);
        successCount++;
      } catch {
        failureCount++;
      }
    }

    // 导入成功后，通知书籍列表相关缓存失效，触发重新拉取数据。
    queryClient.invalidateQueries({ queryKey: ['books'] });

    toast.warning(`成功 ${successCount} 条，失败 ${failureCount} 条`);

    setFile(null);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>批量导入书籍</SheetTitle>
          <SheetDescription>上传 Excel 文件批量录入书籍信息</SheetDescription>
        </SheetHeader>

        <div className='space-y-6 px-4 pt-2'>
          <div className='space-y-2'>
            <Label>第一步：下载填写模板</Label>
            <Button
              variant='outline'
              className='w-full'
              onClick={downloadTemplate}
            >
              <Download className='mr-2 h-4 w-4' />
              下载 Excel 模板
            </Button>
          </div>

          <div className='space-y-2'>
            <Label>第二步：上传填写好的文件</Label>
            <Input
              type='file'
              accept='.xlsx,.xls'
              // 如果传进来的有值，就取第一个文件，否则传 null
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <SheetFooter className='px-4 pt-4'>
          <Button onClick={handleImport} className='w-full'>
            <Upload className='mr-2 h-4 w-4' />
            开始导入
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
