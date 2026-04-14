import { createFileRoute } from '@tanstack/react-router';
import BookRenewal from '@/app/main/book-renewal/book-renewal';
import { roleCheck } from '@/lib/route-guard';

export const Route = createFileRoute('/book-renewal')({
  beforeLoad: async () => {
    await roleCheck(['admin', 'librarian', 'reader']);
  },
  component: BookRenewal,
});
