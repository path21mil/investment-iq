import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function PageContainer({ 
  children, 
  className,
  maxWidth = "max-w-5xl" // Defaults to your standard app width
}: { 
  children: ReactNode; 
  className?: string; 
  maxWidth?: string;
}) {
  return (
    <div className={cn(`${maxWidth} mx-auto w-full px-4 sm:px-6`, className)}>
      {children}
    </div>
  );
}