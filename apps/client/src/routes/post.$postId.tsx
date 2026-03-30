import { createFileRoute } from '@tanstack/react-router';
import Login from '@/auth/sigin-in/page';

export const Route = createFileRoute('/post/$postId')({
  // Or in a component
  component: PostComponent,
});

function PostComponent() {
  // In a component!
  const { postId } = Route.useParams();
  return (
    <>
      <div>Post ID: {postId}</div>
      <div>
        <h1>App Layout</h1>
        <Login />
      </div>
    </>
  );
}
