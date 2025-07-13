'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricsCard from '@/components/dashboard/MetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Store, 
  Users, 
  Ticket, 
  CheckCircle2, 
  AlertTriangle,
  Settings,
  TrendingUp,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ModeratorDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  // State for store data
  const [store, setStore] = useState<any>(null);
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [storeTickets, setStoreTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Load moderator's store data
  useEffect(() => {
    async function loadModeratorData() {
      if (!session?.user?.id) return;
      
      try {
        // Get moderator's assigned store
        const storeResponse = await fetch('/api/stores/moderator');
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          setStore(storeData);
        }

        // Get pending service providers for this store's region
        const providersResponse = await fetch('/api/auth/register');
        if (providersResponse.ok) {
          const allProviders = await providersResponse.json();
          const pending = allProviders.filter((p: any) => 
            p.role === 'SERVICE_PROVIDER' && 
            p.registration_status === 'PENDING'
          );
          setPendingProviders(pending);
        }

        // Get store tickets (mock data for now)
        setStoreTickets([
          {
            id: '1',
            description: 'Freezer issue in Aisle 5',
            status: 'OPEN',
            priority: 'HIGH',
            created_at: '2024-12-20T10:00:00Z'
          },
          {
            id: '2',
            description: 'POS Terminal 3 error',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            created_at: '2024-12-20T14:30:00Z'
          }
        ]);

      } catch (error) {
        console.error('Error loading moderator data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      loadModeratorData();
    }
  }, [session, status]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (session?.user?.role !== 'MODERATOR') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  const handleProviderAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    setActionMsg('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action,
          moderator_id: session?.user?.id 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setActionMsg(`Provider ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
        setPendingProviders(prev => prev.filter(p => p.id !== userId));
        toast({
          title: `Provider ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
          description: `Service provider has been ${action === 'APPROVE' ? 'approved' : 'rejected'}.`,
        });
      } else {
        setActionMsg(data.error || 'Action failed.');
      }
    } catch (error) {
      setActionMsg('Action failed. Please try again.');
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Store Assigned</h1>
          <p>You haven&apos;t been assigned to any store yet. Please contact an administrator.</p>
          <button 
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const openTickets = storeTickets.filter(t => t.status === 'OPEN');
  const inProgressTickets = storeTickets.filter(t => t.status === 'IN_PROGRESS');
  const completedTickets = storeTickets.filter(t => t.status === 'COMPLETED');

  return (
    <DashboardLayout title="Moderator Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Store Moderator Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Managing {store.name} ({store.store_id})
            </p>
            <p className="text-sm text-gray-500">
              Location: {store.address}, {store.city}, {store.state}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {session?.user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Store Tickets"
            value={storeTickets.length}
            icon={Ticket}
            color="blue"
          />
          <MetricsCard
            title="Open Issues"
            value={openTickets.length}
            icon={AlertTriangle}
            color="red"
            description="Requires attention"
          />
          <MetricsCard
            title="In Progress"
            value={inProgressTickets.length}
            icon={TrendingUp}
            color="yellow"
            description="Being resolved"
          />
          <MetricsCard
            title="Pending Approvals"
            value={pendingProviders.length}
            icon={Users}
            color="purple"
            description="Service providers"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Store Name</Label>
                  <p className="text-lg font-semibold">{store.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Store ID</Label>
                  <p className="text-lg font-semibold">{store.store_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                  <p>{store.address}</p>
                  <p>{store.city}, {store.state} {store.zip_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p>{store.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Store Manager</Label>
                  <p>{store.manager_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Provider Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Pending Service Provider Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionMsg && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
                  {actionMsg}
                </div>
              )}
              
              {pendingProviders.length === 0 ? (
                <p className="text-gray-500">No pending service provider approvals.</p>
              ) : (
                <div className="space-y-3">
                  {pendingProviders.map((provider) => (
                    <div key={provider.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{provider.username}</h4>
                          <p className="text-sm text-gray-600">{provider.email}</p>
                          <p className="text-xs text-gray-500">
                            Registered: {new Date(provider.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleProviderAction(provider.id, 'APPROVE')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleProviderAction(provider.id, 'REJECT')}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Store Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storeTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      ticket.status === 'OPEN' ? 'bg-red-500' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <div>
                      <h4 className="font-medium">{ticket.description}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      ticket.priority === 'HIGH' ? 'destructive' :
                      ticket.priority === 'MEDIUM' ? 'secondary' :
                      'default'
                    }>
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline">
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}