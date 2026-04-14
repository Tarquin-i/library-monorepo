import { createFileRoute, Link } from '@tanstack/react-router';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <>
      <Link to='/dashboard'>
        <Button variant='outline'>Go to Dashboard</Button>
      </Link>

      <Camera />
      <div className='text-red-300'>hello world!!</div>
    </>
  );
}
