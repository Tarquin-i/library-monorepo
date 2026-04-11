import { createFileRoute } from '@tanstack/react-router';
import { roleCheck } from '@/lib/route-guard';
import RenewalManagement from '@/app/admin/renewal-management/renewal-management';

export const Route = createFileRoute('/renewal-management')({
  beforeLoad: async () => {
    await roleCheck(['admin', 'librarian']);
  },
  component: RenewalManagement,
});
