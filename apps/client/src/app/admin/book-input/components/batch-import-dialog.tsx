import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
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
import { useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/rpc';
import { Download, Upload } from 'lucide-react';
import type { CreateBookInput } from '@/api/book.query';

// Excel 列头 → API 字段映射
const COLUMN_MAP: Record<string, string> = {
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

const REQUIRED_FIELDS = [
  'ISBN',
  'bookName',
  'author',
  'publisher',
  'publishDate',
  'category',
  'price',
  'totalStock',
  'availableStock',
] as const;

// 校验单行数据，返回错误原因（无错误则返回 null）
function validateRow(
  row: Record<string, unknown>,
): { data: CreateBookInput; error: null } | { data: null; error: string } {
  const missing = REQUIRED_FIELDS.filter((f) => !row[f] && row[f] !== 0);
  if (missing.length > 0)
    return { data: null, error: `缺少必填字段：${missing.join('、')}` };

  const price = Number(row.price);
  const totalStock = Number(row.totalStock);
  const availableStock = Number(row.availableStock);

  if (isNaN(price) || price <= 0)
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
  const headers = Object.keys(COLUMN_MAP);
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
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '书籍信息');
  XLSX.writeFile(wb, '书籍批量导入模板.xlsx');
}

export function BatchImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const importing = progress.total > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  function handleClose(open: boolean) {
    if (importing) return;
    setFile(null);
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(open);
  }

  async function handleImport() {
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: '',
    });

    // 将中文列头转为 API 字段名
    const rows = rawRows.map((raw) =>
      Object.fromEntries(
        Object.entries(COLUMN_MAP).map(([zh, en]) => [en, raw[zh]]),
      ),
    );

    if (rows.length === 0) {
      toast.error('Excel 文件中没有数据');
      return;
    }

    setProgress({ current: 0, total: rows.length });

    let successCount = 0;
    const failures: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      setProgress({ current: i + 1, total: rows.length });
      const validated = validateRow(rows[i]);

      if (validated.error) {
        failures.push(`第 ${i + 2} 行：${validated.error}`);
        continue;
      }

      try {
        const res = await client.books.$post({ json: validated.data });
        const json = await res.json();
        if ('message' in json) {
          failures.push(
            `第 ${i + 2} 行（${validated.data.ISBN}）：${json.message}`,
          );
        } else {
          successCount++;
        }
      } catch {
        failures.push(`第 ${i + 2} 行（${validated.data.ISBN}）：网络错误`);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['books'] });

    if (failures.length === 0) {
      toast.success(`全部导入成功，共 ${successCount} 条`);
    } else {
      const detail = failures.slice(0, 5).join('\n');
      const extra =
        failures.length > 5 ? `\n...共 ${failures.length} 条错误` : '';
      toast.warning(
        `成功 ${successCount} 条，跳过 ${failures.length} 条：\n${detail}${extra}`,
        {
          duration: 8000,
        },
      );
    }

    // 直接重置状态关闭，不经过 handleClose 的 importing 守卫
    setFile(null);
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
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
              ref={fileInputRef}
              type='file'
              accept='.xlsx,.xls'
              disabled={importing}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <SheetFooter className='px-4 pt-4'>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className='w-full'
          >
            <Upload className='mr-2 h-4 w-4' />
            {importing
              ? `导入中 ${progress.current}/${progress.total}`
              : '开始导入'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
