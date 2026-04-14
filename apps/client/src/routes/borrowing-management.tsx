import { createFileRoute } from '@tanstack/react-router';
import BorrowingManagement from '@/app/admin/borrowing-management/borrowing-management';
import { roleCheck } from '@/lib/route-guard';

export const Route = createFileRoute('/borrowing-management')({
  beforeLoad: async () => {
    await roleCheck(['admin', 'librarian']);
  },
  component: BorrowingManagement,
});
