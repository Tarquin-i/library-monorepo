import BorrowingRecords from '@/app/main/borrowing-records/borrowing-records';
import { roleCheck } from '@/lib/route-guard';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/borrowing-records')({
  beforeLoad: async () => {
    await roleCheck(['admin', 'librarian', 'reader']);
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <BorrowingRecords />
    </div>
  );
}
