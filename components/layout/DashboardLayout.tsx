'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  Users, 
  Shield, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Ticket,
  BarChart3,
  Bell
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = () => {
    // Set flag to prevent auto-redirect after signout
    sessionStorage.setItem('justSignedOut', 'true');
    signOut({ callbackUrl: '/auth/signin' });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STORE_REGISTER': return Building2;
      case 'SERVICE_PROVIDER': return Users;
      case 'ADMIN': return Shield;
      case 'MODERATOR': return Settings;
      default: return Building2;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STORE_REGISTER': return 'text-blue-600 bg-blue-50';
      case 'SERVICE_PROVIDER': return 'text-emerald-600 bg-emerald-50';
      case 'ADMIN': return 'text-purple-600 bg-purple-50';
      case 'MODERATOR': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'STORE_REGISTER': return 'Store Register';
      case 'SERVICE_PROVIDER': return 'Service Provider';
      case 'ADMIN': return 'Administrator';
      case 'MODERATOR': return 'Moderator';
      default: return role;
    }
  };

  if (!session?.user) {
    return null;
  }

  const RoleIcon = getRoleIcon(session.user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Smart Issues</h1>
              <p className="text-xs text-gray-500">Routing System</p>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className={getRoleColor(session.user.role)}>
                  <RoleIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.username || session.user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {getRoleDisplayName(session.user.role)}
                </p>
                {/* Show store/service provider info if available */}
                {session.user.store && (
                  <p className="text-xs text-blue-600 mt-1">
                    {session.user.store.name}
                  </p>
                )}
                {session.user.service_provider && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {session.user.service_provider.company_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => {
                  switch (session.user.role) {
                    case 'STORE_REGISTER': router.push('/store'); break;
                    case 'SERVICE_PROVIDER': router.push('/technician'); break;
                    case 'ADMIN': router.push('/admin'); break;
                    case 'MODERATOR': router.push('/moderator'); break;
                  }
                }}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                Dashboard
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => {
                  switch (session.user.role) {
                    case 'STORE_REGISTER': router.push('/store/tickets'); break;
                    case 'SERVICE_PROVIDER': router.push('/technician/tickets'); break;
                    case 'ADMIN': router.push('/admin/tickets'); break;
                    case 'MODERATOR': router.push('/moderator/tickets'); break;
                  }
                }}
              >
                <Ticket className="h-4 w-4 mr-3" />
                Tickets
              </Button>

              {session.user.role === 'STORE_REGISTER' && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => router.push('/store/create-ticket')}
                >
                  <Bell className="h-4 w-4 mr-3" />
                  Report Issue
                </Button>
              )}

              {(session.user.role === 'ADMIN' || session.user.role === 'MODERATOR') && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => {
                    if (session.user.role === 'ADMIN') router.push('/admin/analytics');
                    else router.push('/moderator/analytics');
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Analytics
                </Button>
              )}
            </nav>
          </div>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}