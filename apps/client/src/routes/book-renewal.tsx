import { createFileRoute } from '@tanstack/react-router';
import { roleCheck } from '@/lib/route-guard';
import BookRenewal from '@/app/main/book-renewal/book-renewal';

export const Route = createFileRoute('/book-renewal')({
  beforeLoad: async () => {
    await roleCheck(['admin', 'librarian', 'reader']);
  },
  component: BookRenewal,
});
