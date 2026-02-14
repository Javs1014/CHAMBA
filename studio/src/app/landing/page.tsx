'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LogIn, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLoading } from '@/hooks/use-loading';

export default function ClientLandingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    showLoading();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Redirecting to your portal...",
      });
      router.push(`/client-portal`);
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      toast({
        title: "Login Failed",
        description: "Invalid credentials provided.",
        variant: "destructive",
      });
      hideLoading();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary to-blue-700 text-white overflow-hidden p-4">
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        <Logo className="h-12 w-auto mb-6 text-accent" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Aquarius Client Portal
        </h1>
        <p className="text-lg md:text-xl text-blue-100 mb-10">
          Welcome! Access your proformas, invoices, and other important documents securely.
        </p>

        <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm text-card-foreground">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Client Sign In</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Enter your credentials to access your documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
               <div className="space-y-2 text-left">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
               {error && (
                <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
               <Button type="submit" className="w-full" size="lg">
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
        <p className="mt-12 text-sm text-blue-200">
           Aquarius &copy; {new Date().getFullYear()}. For access, please contact your account manager.
        </p>
      </div>
    </div>
  );
}
