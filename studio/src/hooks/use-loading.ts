'use client';

import { useContext } from 'react';
import { LoadingContext } from '@/contexts/loading-context';

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
