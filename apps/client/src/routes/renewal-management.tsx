import { createFileRoute } from '@tanstack/react-router';
import RenewalManagement from '@/app/admin/renewal-management/renewal-management';
import { roleCheck } from '@/lib/route-guard';

export const Route = createFileRoute('/renewal-management')({
  beforeLoad: async () => {
    await roleCheck(['admin', 'librarian']);
  },
  component: RenewalManagement,
});
