'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/hooks/lib/queryClient';
import { ToastContainer } from '@/components/ui/Toast';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastContainer />
    </QueryClientProvider>
  );
}
