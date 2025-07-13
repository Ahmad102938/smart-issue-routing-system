'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Shield, Users, Settings } from 'lucide-react';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if already authenticated (but not after signout)
  if (status === 'authenticated' && session?.user) {
    // Check if this is a fresh session (not after signout)
    const isAfterSignout = sessionStorage.getItem('justSignedOut');
    if (isAfterSignout) {
      // Clear the flag and don't redirect
      sessionStorage.removeItem('justSignedOut');
      return null;
    }
    
    const role = session.user.role;
    switch (role) {
      case 'STORE_REGISTER':
        router.push('/store');
        break;
      case 'SERVICE_PROVIDER':
        router.push('/technician');
        break;
      case 'ADMIN':
        router.push('/admin');
        break;
      case 'MODERATOR':
        router.push('/moderator');
        break;
      default:
        router.push('/');
    }
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { username, password: '***' });
      
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        console.log('Login failed:', result.error);
        setError(result.error || 'Invalid credentials. Please try again.');
      } else if (result?.ok) {
        console.log('Login successful, redirecting...');
        // The redirect will be handled by the useEffect above when session changes
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Smart Issue Management account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/" className="text-blue-600 underline font-semibold">
                Register here
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Server running on port 3001
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Demo Accounts:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Admin:</strong> admin / admin123</p>
              <p><strong>Store:</strong> store_dallas / store123</p>
              <p><strong>Technician:</strong> tech_john / tech123</p>
              <p><strong>Moderator:</strong> mod1 / 12345678</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 