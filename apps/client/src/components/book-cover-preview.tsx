import { useState } from 'react';
import defaultBookCover from '@/assets/images/default-book-cover.svg';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

export function BookCoverPreview({
  src,
  title,
}: {
  src?: string | null;
  title: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = src?.trim() || '';
  const coverSrc =
    imageSrc && failedSrc !== imageSrc ? imageSrc : defaultBookCover;

  const handleImageError = () => {
    if (imageSrc) {
      setFailedSrc(imageSrc);
    }
  };
  return (
    <Dialog>
      <HoverCard openDelay={120} closeDelay={80}>
        <DialogTrigger asChild>
          <HoverCardTrigger asChild>
            <button
              type='button'
              className='focus-visible:ring-ring/50 block cursor-zoom-in rounded-md outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2'
              aria-label={`查看《${title}》封面`}
            >
              <img
                src={coverSrc}
                alt={title}
                onError={imageSrc ? handleImageError : undefined}
                loading='lazy'
                className='h-14 w-10 rounded-md border object-cover shadow-xs'
              />
            </button>
          </HoverCardTrigger>
        </DialogTrigger>
        <HoverCardContent
          side='right'
          align='start'
          className='w-auto bg-background p-2'
        >
          <img
            src={coverSrc}
            alt={title}
            onError={imageSrc ? handleImageError : undefined}
            className='h-60 w-44 rounded-lg object-cover'
          />
        </HoverCardContent>
      </HoverCard>

      <DialogContent className='max-w-md overflow-hidden p-0 sm:max-w-lg'>
        <DialogHeader className='border-b px-4 py-3 pr-12'>
          <DialogTitle>{`《${title}》封面预览`}</DialogTitle>
          <DialogDescription>查看完整封面图片。</DialogDescription>
        </DialogHeader>
        <div className='bg-muted/30 p-4 pr-12'>
          <img
            src={coverSrc}
            alt={title}
            onError={imageSrc ? handleImageError : undefined}
            className='mx-auto max-h-[80vh] w-auto max-w-full rounded-lg object-contain'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
