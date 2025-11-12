'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCallback, useRef } from 'react';

interface BackButtonProps {
  /** Exact page to navigate to */
  to: string;
  /** Optional label – defaults to "Back" */
  label?: string;
}

/**
 * Fast back button:
 * • Prefetch on mouse‑enter
 * • Instant push on click (no scroll reset)
 * • No extra re‑renders
 */
export default function BackButton({ to, label = 'Back' }: BackButtonProps) {
  const router = useRouter();
  const hasPrefetched = useRef(false);

  // Prefetch only once when the user hovers
  const handleMouseEnter = useCallback(() => {
    if (!hasPrefetched.current) {
      router.prefetch(to);
      hasPrefetched.current = true;
    }
  }, [router, to]);

  // Instant navigation – no scroll, no delay
  const handleClick = useCallback(() => {
    router.push(to, { scroll: false });
  }, [router, to]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-full border bg-background/80 px-3 text-sm font-medium',
        'shadow-sm transition-all duration-150',
        'hover:bg-accent hover:text-accent-foreground hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </Button>
  );
}