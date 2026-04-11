import { createFileRoute } from '@tanstack/react-router';
import { roleCheck } from '@/lib/route-guard';
import BorrowingManagement from '@/app/admin/borrowing-management/borrowing-management';

export const Route = createFileRoute('/borrowing-management')({
  beforeLoad: async () => {
    await roleCheck(['admin', 'librarian']);
  },
  component: BorrowingManagement,
});
