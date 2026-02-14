'use client';

import { createContext, useState, useMemo, type ReactNode, useCallback } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = useCallback(() => setIsLoading(true), []);
  const hideLoading = useCallback(() => setIsLoading(false), []);

  const value = useMemo(() => ({
    isLoading,
    showLoading,
    hideLoading,
  }), [isLoading, showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && <LoadingSpinner />}
    </LoadingContext.Provider>
  );
}
