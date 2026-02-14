
'use client';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useLoading } from '@/hooks/use-loading';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Paths where the admin sidebar/header should NOT be shown
  const noAdminLayoutPaths = ['/landing', '/login', '/client-portal', '/company-site'];
  
  const isAppPage = !noAdminLayoutPaths.some(path => {
    if (path === '/client-portal') return pathname.startsWith(path);
    return pathname === path;
  });

  useEffect(() => {
    if (!isAppPage) {
        setIsAuthChecked(true);
        return;
    }

    showLoading();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setIsAuthChecked(true);
      }
      hideLoading();
    });

    return () => {
      unsubscribe();
      hideLoading();
    };
  }, [pathname, isAppPage, router, showLoading, hideLoading]);

  
  if (!isAuthChecked && isAppPage) {
    return null; // Global loading spinner is shown by the context
  }
  
  if (!isAppPage) {
    return <>{children}</>;
  }


  const handleLogout = async () => {
    showLoading();
    try {
        await signOut(auth);
        router.push('/login');
    } catch (error) {
        console.error("Logout Error:", error);
        hideLoading();
    }
  };

  // For all other app pages, render the full sidebar layout
  return (
      <SidebarProvider defaultOpen>
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
              <Logo className="h-6 w-auto shrink-0 text-sidebar-primary" />
              <span className="text-2xl group-data-[collapsible=icon]:hidden">
                Aquarius
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex-grow">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-2">
            <Button 
                variant="ghost" 
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
                onClick={handleLogout}
              >
              <LogOut className="mr-2 h-5 w-5 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:justify-end">
            <SidebarTrigger className="md:hidden" />
            {/* Add User Profile / Settings Dropdown here if needed */}
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}
