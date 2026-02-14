
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { LogIn, AlertCircle } from 'lucide-react';
import { useLoading } from '@/hooks/use-loading';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const { toast } = useToast();
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
        description: "Welcome back!",
      });
      router.push('/');
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      hideLoading();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary to-blue-700 text-white overflow-hidden p-4">
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        <Logo className="h-12 w-auto mb-4 text-accent" />
        <h1 className="text-5xl font-bold mb-2">
          Aquarius
        </h1>
        <p className="text-lg text-blue-200 mb-8">
          Sign in to continue to your dashboard.
        </p>

        <Card className="w-full text-card-foreground shadow-2xl bg-card">
          <CardHeader>
            <CardTitle>Admin Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@aquarius.com"
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
                  required
                />
              </div>
               {error && (
                <div className="flex items-center gap-2 text-sm text-destructive font-medium p-3 bg-destructive/10 rounded-md">
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
        <p className="mt-8 text-sm text-blue-200">
          Aquarius &copy; {new Date().getFullYear()}.
        </p>
      </div>
    </div>
  );
}
