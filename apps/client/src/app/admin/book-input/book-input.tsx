import { Plus, Search, Upload } from 'lucide-react';
import { useState } from 'react';
import type { Book } from '@/api/book.query';
import { BatchImportDialog } from '@/app/admin/book-input/components/batch-import-dialog';
import { BookDeleteDialog } from '@/app/admin/book-input/components/book-delete-dialog';
import { BookEditDrawer } from '@/app/admin/book-input/components/book-edit-drawer';
import { BookInputForm } from '@/app/admin/book-input/components/book-input-form';
import { BookListTable } from '@/app/admin/book-input/components/book-list-table';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function BookInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  function handleEdit(book: Book) {
    setSelectedBook(book);
    setEditOpen(true);
  }

  function handleDelete(book: Book) {
    setSelectedBook(book);
    setDeleteOpen(true);
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
              <Input
                placeholder='搜索书籍...'
                className='pl-9'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant='outline' onClick={() => setBatchOpen(true)}>
              <Upload className='mr-2 h-4 w-4' />
              批量录入
            </Button>
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              录入书籍
            </Button>
          </div>

          <div className='rounded-md border'>
            <BookListTable
              searchTerm={searchTerm}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </SidebarInset>

      <BookInputForm open={sheetOpen} onOpenChange={setSheetOpen} />
      <BatchImportDialog open={batchOpen} onOpenChange={setBatchOpen} />
      {selectedBook && (
        <BookEditDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          book={selectedBook}
        />
      )}
      {selectedBook && (
        <BookDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          book={selectedBook}
        />
      )}
    </SidebarProvider>
  );
}
