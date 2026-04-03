import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { BookInputForm } from '@/app/admin/book-input/components/book-input-form';
import { BookListTable } from '@/app/admin/book-input/components/book-list-table';

export default function BookInput() {
  const [sheetOpen, setSheetOpen] = useState(false);

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
            <BookListTable />
          </div>
        </div>
      </SidebarInset>

      <BookInputForm open={sheetOpen} onOpenChange={setSheetOpen} />
    </SidebarProvider>
  );
}
