import { createFileRoute } from '@tanstack/react-router';
import SignUp from '@/app/auth/sign-up/page';

export const Route = createFileRoute('/register')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <SignUp />
    </div>
  );
}
