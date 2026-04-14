import { createFileRoute } from '@tanstack/react-router';
import RenewalRecords from '@/app/main/renewal-records/renewal-records';
import { roleCheck } from '@/lib/route-guard';

export const Route = createFileRoute('/renewal-records')({
  beforeLoad: async () => {
    await roleCheck(['admin', 'librarian', 'reader']);
  },
  component: RenewalRecords,
});
