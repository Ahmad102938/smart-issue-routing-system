'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function ModeratorDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
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
      if (!user) return;
      
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

    loadModeratorData();
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    if (user.role !== 'MODERATOR') {
      router.push('/');
      return;
    }
  }, [user, router]);

  const handleProviderAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    setActionMsg('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action,
          moderator_id: user?.id 
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
    localStorage.removeItem('currentUser');
    router.push('/auth/signin');
  };

  if (loading) {
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
          <p>You haven't been assigned to any store yet. Please contact an administrator.</p>
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
              Welcome, {user?.username}
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
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant={store.status === 'APPROVED' ? 'default' : 'secondary'}>
                    {store.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm">New ticket created: Freezer issue</span>
                  <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Service provider approved: Elite Tech Services</span>
                  <span className="text-xs text-gray-500 ml-auto">4 hours ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm">Ticket assigned to technician</span>
                  <span className="text-xs text-gray-500 ml-auto">6 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Service Provider Approvals */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Service Provider Approvals</h2>
          {pendingProviders.length === 0 ? (
            <div className="text-gray-500">No pending service provider registrations.</div>
          ) : (
            <div className="space-y-4">
              {pendingProviders.map(provider => (
                <div key={provider.id} className="border rounded p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="font-semibold">{provider.service_provider?.company_name}</div>
                    <div className="text-sm text-gray-600">Company ID: {provider.service_provider?.unique_company_id}</div>
                    <div className="text-sm text-gray-600">Location: {provider.service_provider?.primary_location_address}</div>
                    <div className="text-sm text-gray-600">Registered by: {provider.username} ({provider.email})</div>
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
                      className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 flex items-center gap-2"
                      onClick={() => handleProviderAction(provider.id, 'APPROVE')}
                    >
                      <UserCheck className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 flex items-center gap-2"
                      onClick={() => handleProviderAction(provider.id, 'REJECT')}
                    >
                      <UserX className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {actionMsg && <div className="mt-2 text-sm text-blue-700">{actionMsg}</div>}
        </div>

        {/* Store Tickets */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Store Tickets</h2>
          {storeTickets.length === 0 ? (
            <div className="text-gray-500">No tickets found for this store.</div>
          ) : (
            <div className="space-y-4">
              {storeTickets.map(ticket => (
                <div key={ticket.id} className="border rounded p-4 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{ticket.description}</div>
                      <div className="text-sm text-gray-600">Ticket ID: {ticket.id}</div>
                      <div className="text-sm text-gray-600">Created: {new Date(ticket.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={
                        ticket.priority === 'HIGH' ? 'destructive' : 
                        ticket.priority === 'MEDIUM' ? 'default' : 'secondary'
                      }>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={
                        ticket.status === 'OPEN' ? 'destructive' :
                        ticket.status === 'IN_PROGRESS' ? 'default' :
                        ticket.status === 'COMPLETED' ? 'secondary' : 'outline'
                      }>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}