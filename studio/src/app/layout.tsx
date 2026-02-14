
'use client';
import type { ReactNode } from 'react';
import './globals.css';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { LoadingProvider } from '@/contexts/loading-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <QueryClientProvider client={queryClient}>
          <LoadingProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </LoadingProvider>
        </QueryClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
