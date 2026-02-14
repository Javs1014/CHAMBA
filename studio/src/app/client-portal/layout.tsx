
'use client';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLoading } from '@/hooks/use-loading';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';


export default function ClientPortalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showLoading, hideLoading } = useLoading();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Logic to determine if user should be on client-facing pages
      const isAdminSession = sessionStorage.getItem('isAdmin');
      
      if (!user && !isAdminSession) {
        // If there's no logged-in user and it's not an admin viewing as a client,
        // redirect to the landing page.
        router.push('/landing');
      } else {
        // If there is a user OR it's an admin session, they can stay.
        setIsClientLoggedIn(!!user); // isClientLoggedIn is true only if a Firebase user is actually signed in
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);
  
  useEffect(() => {
    if (isAuthLoading) {
      showLoading();
    } else {
      hideLoading();
    }
  }, [isAuthLoading, showLoading, hideLoading]);

  const handleLogout = async () => {
    showLoading();
    try {
        sessionStorage.removeItem('isAdmin');
        await signOut(auth);
        router.push('/landing');
    } catch (error) {
        console.error("Logout Error:", error);
        hideLoading();
    }
  };

  if (isAuthLoading) {
    return null; // Global loading spinner will be shown via context
  }

  // The 'isAdmin' session flag is used to decide if the logout button should appear.
  // It's set when an admin clicks "View Client Portal"
  const isAdminViewing = sessionStorage.getItem('isAdmin') === 'true';

  return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/80 px-6 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between">
                <Link href="/client-portal" className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Logo className="h-8 w-auto text-accent" />
                    <span>Client Portal</span>
                </Link>
                {/* Only show logout if a client is logged in, not an admin viewing the portal */}
                {isClientLoggedIn && !isAdminViewing && (
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4"/>
                      Sign Out
                  </Button>
                )}
            </div>
        </header>
        <main>
            {children}
        </main>
      </div>
  );
}

