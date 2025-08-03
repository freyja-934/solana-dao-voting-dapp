'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ visible, message, className }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center",
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-card p-6 rounded-lg shadow-lg border text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-sm font-medium">
          {message || 'Processing transaction...'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Please wait, this may take a few moments
        </p>
      </div>
    </div>
  );
} 