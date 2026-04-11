import { createFileRoute } from '@tanstack/react-router';
import { roleCheck } from '@/lib/route-guard';
import RenewalRecords from '@/app/main/renewal-records/renewal-records';

export const Route = createFileRoute('/renewal-records')({
  beforeLoad: async () => {
    await roleCheck(['admin', 'librarian', 'reader']);
  },
  component: RenewalRecords,
});
