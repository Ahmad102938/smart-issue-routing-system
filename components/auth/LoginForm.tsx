'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Shield, Users, Settings } from 'lucide-react';
import { login } from '@/lib/auth';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(username, password);
      if (user) {
        // Redirect based on role
        switch (user.role) {
          case 'store_register':
            router.push('/store');
            break;
          case 'service_provider':
            router.push('/technician');
            break;
          case 'admin':
            router.push('/admin');
            break;
          case 'moderator':
            router.push('/moderator');
            break;
          default:
            router.push('/');
        }
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Store Register', username: 'dallas_store_001', icon: Building2, color: 'text-blue-600' },
    { role: 'Service Provider', username: 'tech_john_doe', icon: Users, color: 'text-emerald-600' },
    { role: 'Admin', username: 'admin_sarah', icon: Shield, color: 'text-purple-600' },
    { role: 'Moderator', username: 'mod_dallas', icon: Settings, color: 'text-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Smart Issue Routing
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your Walmart maintenance portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-11"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Demo System Access
            </h2>
            <p className="text-gray-600 text-lg">
              Try different user roles to experience the complete workflow
            </p>
          </div>

          <div className="grid gap-4">
            {demoCredentials.map((cred) => {
              const Icon = cred.icon;
              return (
                <Card 
                  key={cred.username}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-l-4 border-l-transparent hover:border-l-blue-500"
                  onClick={() => {
                    setUsername(cred.username);
                    setPassword('password123');
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gray-50 ${cred.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{cred.role}</div>
                        <div className="text-sm text-gray-500">{cred.username}</div>
                      </div>
                      <div className="ml-auto text-xs text-gray-400">
                        Click to use
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center lg:text-left">
            <p className="text-sm text-gray-500">
              Password for all demo accounts: <code className="px-2 py-1 bg-gray-100 rounded">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}