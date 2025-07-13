'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricsCard from '@/components/dashboard/MetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  Ticket, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { ChartContainer } from '@/components/ui/chart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Debug logging
  console.log("AdminDashboard rendered", { session, status, hasError });

  // Add session refresh mechanism and connection monitoring
  useEffect(() => {
    const refreshSession = async () => {
      try {
        // Refresh the session every 5 minutes to prevent expiration
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          console.log('Session refresh failed, redirecting to signin');
          router.push('/auth/signin');
        }
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Session refresh error:', error);
        setIsOnline(false);
      }
    };

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(refreshSession, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  // Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Pending Store Registrations State
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  // Service Provider Management State
  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerMsg, setProviderMsg] = useState("");

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userMsg, setUserMsg] = useState("");

  // Moderator Management State
  const [moderators, setModerators] = useState<any[]>([]);
  const [loadingModerators, setLoadingModerators] = useState(false);
  const [moderatorMsg, setModeratorMsg] = useState("");
  const [showModeratorForm, setShowModeratorForm] = useState(false);
  const [moderatorForm, setModeratorForm] = useState({
    username: '',
    email: '',
    password: '',
    store_id: ''
  });

  // Approved Stores State (for moderator assignment)
  const [approvedStoresForModerator, setApprovedStoresForModerator] = useState<any[]>([]);
  const [loadingApprovedStores, setLoadingApprovedStores] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      console.log('No user found, redirecting to signin');
      router.push('/auth/signin');
      return;
    }
    
    if (session?.user?.role !== 'ADMIN') {
      console.log('User is not admin, redirecting to home');
      router.push('/');
      return;
    }
    
    console.log('User is admin, proceeding to dashboard');
  }, [session, status, router]);

  useEffect(() => {
    async function fetchPendingStores() {
      setLoadingStores(true);
      let retries = 3;
      
      while (retries > 0) {
        try {
          const res = await fetch('/api/auth/register', {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          
          const data = await res.json();
          setPendingStores(
            data.filter((u: any) => u.role === 'STORE_REGISTER' && u.registration_status === 'PENDING')
          );
          break;
        } catch (error) {
          console.error(`Fetch pending stores attempt ${4 - retries} failed:`, error);
          retries--;
          if (retries === 0) {
            setPendingStores([]);
            toast({
              title: "Connection Error",
              description: "Failed to load pending stores. Please refresh the page.",
              variant: "destructive"
            });
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      setLoadingStores(false);
    }
    fetchPendingStores();
  }, [toast]);

  useEffect(() => {
    async function fetchProviders() {
      setLoadingProviders(true);
      const res = await fetch('/api/auth/register');
      let data = [];
      try {
        data = await res.json();
      } catch (e) {
        data = [];
      }
      if (!res.ok) {
        setProviders([]);
        setLoadingProviders(false);
        return;
      }
      setProviders(
        data.filter((u: any) => u.role === 'SERVICE_PROVIDER')
      );
      setLoadingProviders(false);
    }
    fetchProviders();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      const res = await fetch('/api/auth/register');
      let data = [];
      try {
        data = await res.json();
      } catch (e) {
        data = [];
      }
      if (!res.ok) {
        setUsers([]);
        setLoadingUsers(false);
        return;
      }
      setUsers(data);
      setLoadingUsers(false);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchModerators() {
      setLoadingModerators(true);
      const res = await fetch('/api/auth/moderator');
      let data = [];
      try {
        data = await res.json();
      } catch (e) {
        data = [];
      }
      if (!res.ok) {
        setModerators([]);
        setLoadingModerators(false);
        return;
      }
      setModerators(data);
      setLoadingModerators(false);
    }
    fetchModerators();
  }, []);

  useEffect(() => {
    async function fetchDashboardStats() {
      setLoadingStats(true);
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setDashboardStats(data);
        } else {
          console.error('Failed to fetch dashboard stats');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    async function fetchApprovedStores() {
      setLoadingApprovedStores(true);
      try {
        // Fetch all stores from the database
        const res = await fetch('/api/stores');
        if (res.ok) {
          const stores = await res.json();
          // Filter for approved stores that don't have a moderator assigned
          const approved = stores.filter((store: any) => 
            store.status === 'APPROVED' && !store.moderator_user_id
          );
          setApprovedStoresForModerator(approved);
        } else {
          setApprovedStoresForModerator([]);
        }
      } catch (error) {
        console.error('Error fetching approved stores:', error);
        setApprovedStoresForModerator([]);
      } finally {
        setLoadingApprovedStores(false);
      }
    }
    fetchApprovedStores();
  }, []);

  function addAuditTrail(action: string, details: string) {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    const existing = JSON.parse(localStorage.getItem('admin_audit_trail') || '[]');
    existing.unshift(entry);
    localStorage.setItem('admin_audit_trail', JSON.stringify(existing.slice(0, 50)));
  }

  async function handleStoreAction(userId: string, action: 'APPROVE' | 'REJECT') {
    setActionMsg('');
    const res = await fetch('/api/auth/register', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action })
    });
    const data = await res.json();
    if (res.ok) {
      setActionMsg(`Store ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
      setPendingStores(pendingStores.filter(s => s.id !== userId));
      toast({
        title: `Store ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
        description: `Store registration has been ${action === 'APPROVE' ? 'approved' : 'rejected'}.`,
      });
      addAuditTrail(`Store ${action}`, `Store userId: ${userId}`);
    } else {
      setActionMsg(data.error || 'Action failed.');
    }
  }

  async function handleProviderAction(userId: string, action: 'APPROVE' | 'REJECT') {
    setProviderMsg('');
    const res = await fetch('/api/auth/register', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action })
    });
    const data = await res.json();
    if (res.ok) {
      setProviderMsg(`Provider ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
      setProviders(providers.filter(p => p.id !== userId));
      toast({
        title: `Provider ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
        description: `Provider registration has been ${action === 'APPROVE' ? 'approved' : 'rejected'}.`,
      });
      addAuditTrail(`Provider ${action}`, `Provider userId: ${userId}`);
    } else {
      setProviderMsg(data.error || 'Action failed.');
    }
  }

  async function handleProviderStatus(userId: string, isActive: boolean) {
    // Prevent admin from deactivating themselves if they are also a service provider
    if (userId === session?.user?.id) {
      setProviderMsg('You cannot deactivate your own account.');
      toast({
        title: 'Action Denied',
        description: 'You cannot deactivate your own account.',
        variant: 'destructive'
      });
      return;
    }

    setProviderMsg('');
    const res = await fetch('/api/auth/register', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: isActive ? 'DEACTIVATE' : 'ACTIVATE' })
    });
    const data = await res.json();
    if (res.ok) {
      setProviderMsg(`Provider ${isActive ? 'deactivated' : 'activated'} successfully.`);
      setProviders(providers.map(p => p.id === userId ? { ...p, is_active: !isActive } : p));
      toast({
        title: `Provider ${isActive ? 'Deactivated' : 'Activated'}`,
        description: `Provider has been ${isActive ? 'deactivated' : 'activated'}.`,
      });
      addAuditTrail(`Provider ${isActive ? 'Deactivated' : 'Activated'}`, `Provider userId: ${userId}`);
    } else {
      setProviderMsg(data.error || 'Action failed.');
    }
  }

  async function handleUserStatus(userId: string, isActive: boolean) {
    // Prevent admin from deactivating themselves
    if (userId === session?.user?.id) {
      setUserMsg('You cannot deactivate your own account.');
      toast({
        title: 'Action Denied',
        description: 'You cannot deactivate your own account.',
        variant: 'destructive'
      });
      return;
    }

    setUserMsg('');
    const res = await fetch('/api/auth/register', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: isActive ? 'DEACTIVATE' : 'ACTIVATE' })
    });
    const data = await res.json();
    if (res.ok) {
      setUserMsg(`User ${isActive ? 'deactivated' : 'activated'} successfully.`);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
      toast({
        title: `User ${isActive ? 'Deactivated' : 'Activated'}`,
        description: `User has been ${isActive ? 'deactivated' : 'activated'}.`,
      });
      addAuditTrail(`User ${isActive ? 'Deactivated' : 'Activated'}`, `User userId: ${userId}`);
    } else {
      setUserMsg(data.error || 'Action failed.');
    }
  }

  async function handleCreateModerator() {
    if (!moderatorForm.username || !moderatorForm.email || !moderatorForm.password || !moderatorForm.store_id) {
      setModeratorMsg('All fields are required');
      return;
    }

    setModeratorMsg('');
    const res = await fetch('/api/auth/moderator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...moderatorForm,
        admin_user_id: session?.user?.id
      })
    });
    const data = await res.json();
    if (res.ok) {
      setModeratorMsg('Moderator created successfully');
      setModeratorForm({ username: '', email: '', password: '', store_id: '' });
      setShowModeratorForm(false);
      // Refresh moderators list
      const moderatorsRes = await fetch('/api/auth/moderator');
      if (moderatorsRes.ok) {
        const moderatorsData = await moderatorsRes.json();
        setModerators(moderatorsData);
      }
      toast({
        title: 'Moderator Created',
        description: 'New moderator has been created and assigned to store.',
      });
      addAuditTrail('Moderator Created', `Moderator: ${moderatorForm.username}, Store: ${moderatorForm.store_id}`);
    } else {
      setModeratorMsg(data.error || 'Failed to create moderator');
    }
  }

  async function handleModeratorStatus(moderatorId: string, isActive: boolean) {
    // Prevent admin from deactivating themselves if they are also a moderator
    if (moderatorId === session?.user?.id) {
      setModeratorMsg('You cannot deactivate your own account.');
      toast({
        title: 'Action Denied',
        description: 'You cannot deactivate your own account.',
        variant: 'destructive'
      });
      return;
    }

    setModeratorMsg('');
    const res = await fetch('/api/auth/moderator', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        moderator_id: moderatorId, 
        action: isActive ? 'DEACTIVATE' : 'ACTIVATE' 
      })
    });
    const data = await res.json();
    if (res.ok) {
      setModeratorMsg(`Moderator ${isActive ? 'deactivated' : 'activated'} successfully`);
      setModerators(moderators.map(m => m.id === moderatorId ? { ...m, is_active: !isActive } : m));
      toast({
        title: `Moderator ${isActive ? 'Deactivated' : 'Activated'}`,
        description: `Moderator has been ${isActive ? 'deactivated' : 'activated'}.`,
      });
      addAuditTrail(`Moderator ${isActive ? 'Deactivated' : 'Activated'}`, `Moderator ID: ${moderatorId}`);
    } else {
      setModeratorMsg(data.error || 'Action failed');
    }
  }

  async function handleRemoveModeratorFromStore(moderatorId: string) {
    if (!window.confirm('Are you sure you want to remove this moderator from their assigned store?')) {
      return;
    }

    setModeratorMsg('');
    const res = await fetch('/api/auth/moderator', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        moderator_id: moderatorId, 
        action: 'REMOVE_STORE' 
      })
    });
    const data = await res.json();
    if (res.ok) {
      setModeratorMsg('Moderator removed from store successfully');
      // Refresh moderators list
      const moderatorsRes = await fetch('/api/auth/moderator');
      if (moderatorsRes.ok) {
        const moderatorsData = await moderatorsRes.json();
        setModerators(moderatorsData);
      }
      toast({
        title: 'Moderator Removed',
        description: 'Moderator has been removed from their assigned store.',
      });
      addAuditTrail('Moderator Removed from Store', `Moderator ID: ${moderatorId}`);
    } else {
      setModeratorMsg(data.error || 'Action failed');
    }
  }

  const handleLogout = async () => {
    console.log('Logging out...');
    try {
      // Set flag to prevent auto-redirect after signout
      sessionStorage.setItem('justSignedOut', 'true');
      
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      });
    } catch (error) {
      console.error('Signout error:', error);
      // Fallback: redirect manually
      sessionStorage.setItem('justSignedOut', 'true');
      window.location.href = '/auth/signin';
    }
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    window.location.reload();
  };

  // Get real data from API or use defaults
  const stats = dashboardStats?.stats || {};
  const charts = dashboardStats?.charts || {};
  
  const totalStores = stats.totalStores || 0;
  const totalProviders = stats.totalProviders || 0;
  const approvedProviders = stats.approvedProviders || 0;
  const totalTickets = stats.totalTickets || 0;
  const openTickets = stats.openTickets || 0;
  const inProgressTickets = stats.inProgressTickets || 0;
  const completedTickets = stats.completedTickets || 0;
  const slaCompliance = stats.slaCompliance || 0;

  // Use real chart data or fallback to empty arrays
  const categoryData = charts.categoryData || [];
  const priorityData = charts.priorityData || [];
  const ticketTrendData = charts.ticketTrendData || [];
  const ticketStatusData = charts.statusData || [];
  const slaData = charts.slaData || [];
  const techPerformanceData = charts.techPerformanceData || [];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Loading Dashboard...</h1>
          <p className="text-gray-600">Please wait while we load your admin dashboard.</p>
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  // Error boundary
  if (hasError) {
    console.log("Error boundary triggered");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
          <p className="mb-4">There was an error loading the admin dashboard.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  console.log("About to enter try block");

  try {
    console.log("About to render DashboardLayout");
    return (
      <DashboardLayout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
            <p className="text-gray-600 mt-1">
              Global monitoring and management across all stores
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className={`flex items-center gap-2 text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isOnline ? 'Connected' : 'Offline'}
              </div>
              <span className="text-xs text-gray-500">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                onClick={handleRefresh}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {session?.user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/tickets')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Ticket className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Ticket Management</h3>
                  <p className="text-sm text-gray-600">View and manage all tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/analytics')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-600">Detailed insights and metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-600">Manage users and approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Stores"
            value={totalStores}
            description={`${approvedStoresForModerator.length} approved`}
            icon={Building2}
            color="blue"
          />
          <MetricsCard
            title="Service Providers"
            value={totalProviders}
            description={`${approvedProviders} active`}
            icon={Users}
            color="green"
          />
          <MetricsCard
            title="Total Tickets"
            value={totalTickets}
            icon={Ticket}
            color="purple"
            trend={{ value: 8, isPositive: true }}
          />
          <MetricsCard
            title="SLA Compliance"
            value={`${slaCompliance}%`}
            icon={TrendingUp}
            color="green"
            trend={{ value: 2.1, isPositive: true }}
          />
        </div>

        {/* Loading State */}
        {loadingStats && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Loading Dashboard Data
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Fetching real-time statistics and analytics from the database...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Connection Notice */}
        {!loadingStats && totalStores === 0 && totalProviders === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No Data Available
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    No stores or service providers found in the database. The dashboard will show real data once entities are registered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricsCard
            title="Open Tickets"
            value={openTickets}
            description="Awaiting assignment"
            icon={AlertTriangle}
            color="yellow"
          />
          <MetricsCard
            title="In Progress"
            value={inProgressTickets}
            description="Being resolved"
            icon={Clock}
            color="blue"
          />
          <MetricsCard
            title="Completed"
            value={completedTickets}
            description="Successfully resolved"
            icon={CheckCircle2}
            color="green"
          />
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issues by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Issues by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No category data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${item.value}%`,
                              backgroundColor: item.color 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issues by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Issues by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              {priorityData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No priority data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {priorityData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name} Priority</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${item.value}%`,
                              backgroundColor: item.color 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Trends (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketTrendData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No trend data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={ticketTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tickets" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Ticket Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketStatusData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No status data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={ticketStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {ticketStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#3B82F6", "#10B981", "#F59E0B", "#22D3EE", "#EF4444"][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Compliance (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {slaData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No SLA data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={slaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sla" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Technician Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {techPerformanceData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No performance data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={techPerformanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {totalStores === 0 && totalProviders === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity. Data will appear here once stores and service providers are registered.</p>
                </div>
              ) : (
                <>
                  {pendingStores.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm">{pendingStores.length} pending store registration(s) awaiting approval</span>
                      <span className="text-xs text-gray-500 ml-auto">Recent</span>
                    </div>
                  )}
                  {providers.filter((p: any) => p.registration_status === 'PENDING').length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-sm">{providers.filter((p: any) => p.registration_status === 'PENDING').length} pending service provider registration(s) awaiting approval</span>
                      <span className="text-xs text-gray-500 ml-auto">Recent</span>
                    </div>
                  )}
                  {openTickets > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-sm">{openTickets} open ticket(s) requiring attention</span>
                      <span className="text-xs text-gray-500 ml-auto">Active</span>
                    </div>
                  )}
                  {completedTickets > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">{completedTickets} ticket(s) completed successfully</span>
                      <span className="text-xs text-gray-500 ml-auto">Recent</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Store Registrations */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Store Registrations</h2>
          {loadingStores ? (
            <div>Loading...</div>
          ) : pendingStores.length === 0 ? (
            <div className="text-gray-500">No pending store registrations.</div>
          ) : (
            <div className="space-y-4">
              {pendingStores.map(storeUser => (
                <div key={storeUser.id} className="border rounded p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="font-semibold">{storeUser.store?.name}</div>
                    <div className="text-sm text-gray-600">Store ID: {storeUser.store?.store_id}</div>
                    <div className="text-sm text-gray-600">Location: {storeUser.store?.address}, {storeUser.store?.city}, {storeUser.store?.state}</div>
                    <div className="text-sm text-gray-600">Registered by: {storeUser.username || 'N/A'} ({storeUser.email})</div>
                    <div className="text-sm text-gray-600">Legal Docs:</div>
                    <ul className="ml-4 list-disc">
                      {storeUser.documents && storeUser.documents.length > 0 ? (
                        storeUser.documents.map((doc: any) => (
                          <li key={doc.id}>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{doc.type}</a>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">No documents uploaded</li>
                      )}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700"
                      onClick={() => handleStoreAction(storeUser.id, 'APPROVE')}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
                      onClick={() => handleStoreAction(storeUser.id, 'REJECT')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {actionMsg && <div className="mt-2 text-sm text-blue-700">{actionMsg}</div>}
        </div>

        {/* Pending Service Provider Registrations */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Service Provider Registrations</h2>
          {loadingProviders ? (
            <div>Loading...</div>
          ) : providers.filter((p: any) => p.registration_status === 'PENDING').length === 0 ? (
            <div className="text-gray-500">No pending service provider registrations.</div>
          ) : (
            <div className="space-y-4">
              {providers.filter((p: any) => p.registration_status === 'PENDING').map(provider => (
                <div key={provider.id} className="border rounded p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="font-semibold">{provider.service_provider?.company_name}</div>
                    <div className="text-sm text-gray-600">Company ID: {provider.service_provider?.unique_company_id}</div>
                    <div className="text-sm text-gray-600">Location: {provider.service_provider?.primary_location_address}</div>
                    <div className="text-sm text-gray-600">Registered by: {provider.username || 'N/A'} ({provider.email})</div>
                    <div className="text-sm text-gray-600">Skills: {provider.service_provider?.skills?.join(', ')}</div>
                    <div className="text-sm text-gray-600">Capacity: {provider.service_provider?.capacity_per_day} tickets/day</div>
                    <div className="text-sm text-gray-600">Documents:</div>
                    <ul className="ml-4 list-disc">
                      {provider.documents && provider.documents.length > 0 ? (
                        provider.documents.map((doc: any) => (
                          <li key={doc.id}>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{doc.type}</a>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">No documents uploaded</li>
                      )}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700"
                      onClick={() => handleProviderAction(provider.id, 'APPROVE')}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
                      onClick={() => handleProviderAction(provider.id, 'REJECT')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {providerMsg && <div className="mt-2 text-sm text-blue-700">{providerMsg}</div>}
        </div>

        {/* Active Service Provider Management */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Service Provider Management</h2>
          {loadingProviders ? (
            <div>Loading...</div>
          ) : providers.filter((p: any) => p.registration_status === 'APPROVED').length === 0 ? (
            <div className="text-gray-500">No active service providers found.</div>
          ) : (
            <div className="space-y-4">
              {providers.filter((p: any) => p.registration_status === 'APPROVED').map(provider => (
                <div key={provider.id} className="border rounded p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="font-semibold">{provider.service_provider?.company_name}</div>
                    <div className="text-sm text-gray-600">Company ID: {provider.service_provider?.unique_company_id}</div>
                    <div className="text-sm text-gray-600">Location: {provider.service_provider?.primary_location_address}</div>
                    <div className="text-sm text-gray-600">Registered by: {provider.username || 'N/A'} ({provider.email})</div>
                    <div className="text-sm text-gray-600">Status: <span className={`font-semibold ${provider.is_active ? 'text-green-600' : 'text-red-600'}`}>{provider.is_active ? 'Active' : 'Inactive'}</span></div>
                    <div className="text-sm text-gray-600">Skills: {provider.service_provider?.skills?.join(', ')}</div>
                    <div className="text-sm text-gray-600">Capacity: {provider.service_provider?.capacity_per_day} tickets/day</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-2 rounded font-semibold ${provider.is_active ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      onClick={() => handleProviderStatus(provider.id, provider.is_active)}
                    >
                      {provider.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {providerMsg && <div className="mt-2 text-sm text-blue-700">{providerMsg}</div>}
        </div>

        {/* Moderator Management */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Moderator Management</h2>
          <div className="mb-4">
            <button
              onClick={() => setShowModeratorForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
            >
              Create New Moderator
            </button>
          </div>
          
          {/* Moderator Creation Form */}
          {showModeratorForm && (
            <div className="border rounded p-6 bg-gray-50 mb-6">
              <h3 className="text-lg font-semibold mb-4">Create New Moderator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={moderatorForm.username}
                    onChange={(e) => setModeratorForm({...moderatorForm, username: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={moderatorForm.email}
                    onChange={(e) => setModeratorForm({...moderatorForm, email: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={moderatorForm.password}
                    onChange={(e) => setModeratorForm({...moderatorForm, password: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assign to Store</label>
                  <select
                    value={moderatorForm.store_id}
                    onChange={(e) => setModeratorForm({...moderatorForm, store_id: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a store</option>
                    {approvedStoresForModerator.map((store: any) => (
                      <option key={store.id} value={store.store_id}>
                        {store.name} ({store.store_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCreateModerator}
                  className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700"
                >
                  Create Moderator
                </button>
                <button
                  onClick={() => setShowModeratorForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded font-semibold hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
              {moderatorMsg && <div className="mt-2 text-sm text-blue-700">{moderatorMsg}</div>}
            </div>
          )}

          {/* Existing Moderators */}
          <div className="space-y-4">
            {moderators.map(moderator => (
              <div key={moderator.id} className="border rounded p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{moderator.username}</div>
                    <div className="text-sm text-gray-600">{moderator.email}</div>
                    <div className="text-sm text-gray-600">
                      Status: <span className={`font-semibold ${moderator.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {moderator.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Assigned Store: {moderator.moderated_stores?.[0]?.name || 'No store assigned'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 rounded font-semibold ${moderator.is_active ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      onClick={() => handleModeratorStatus(moderator.id, moderator.is_active)}
                    >
                      {moderator.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {moderator.moderated_stores?.[0] && (
                      <button
                        className="bg-yellow-600 text-white px-3 py-1 rounded font-semibold hover:bg-yellow-700"
                        onClick={() => handleRemoveModeratorFromStore(moderator.id)}
                      >
                        Remove from Store
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Management */}
        <div>
          <h2 className="text-2xl font-bold mb-4">User Management</h2>
          {loadingUsers ? (
            <div>Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Username</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Role</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Registration</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(userItem => (
                    <tr key={userItem.id} className={`border-b ${userItem.id === session?.user?.id ? 'bg-blue-50' : ''}`}>
                      <td className="p-2 border">
                        {userItem.username}
                        {userItem.id === session?.user?.id && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">You</span>}
                      </td>
                      <td className="p-2 border">{userItem.email}</td>
                      <td className="p-2 border">{userItem.role}</td>
                      <td className="p-2 border">
                        <span className={`font-semibold ${userItem.is_active ? 'text-green-600' : 'text-red-600'}`}>{userItem.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="p-2 border">{userItem.registration_status}</td>
                      <td className="p-2 border">
                        {userItem.id === session?.user?.id ? (
                          <span className="text-gray-500 text-sm">Cannot modify own account</span>
                        ) : (
                          <button
                            className={`px-3 py-1 rounded font-semibold ${userItem.is_active ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                            onClick={() => handleUserStatus(userItem.id, userItem.is_active)}
                          >
                            {userItem.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {userMsg && <div className="mt-2 text-sm text-blue-700">{userMsg}</div>}
        </div>
      </div>
    </DashboardLayout>
  );
  } catch (error) {
    console.error('Admin dashboard error:', error);
    setHasError(true);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
          <p className="mb-4">There was an error loading the admin dashboard.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Fallback render - this should never be reached, but ensures something renders
  console.log("Fallback render reached - this shouldn't happen");
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Admin Dashboard</h1>
        <p className="mb-4">Session: {JSON.stringify(session)}</p>
        <p className="mb-4">Status: {status}</p>
        <p className="mb-4">Error State: {hasError ? 'Yes' : 'No'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}