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
  Clock
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { mockStores, mockServiceProviders, mockTickets } from '@/lib/mockData';
import { ChartContainer } from '@/components/ui/chart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const { toast } = useToast();

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

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    async function fetchPendingStores() {
      setLoadingStores(true);
      const res = await fetch('/api/auth/register');
      let data = [];
      try {
        data = await res.json();
      } catch (e) {
        data = [];
      }
      if (!res.ok) {
        setPendingStores([]);
        setLoadingStores(false);
        return;
      }
      setPendingStores(
        data.filter((u: any) => u.role === 'STORE_REGISTER' && u.registration_status === 'PENDING')
      );
      setLoadingStores(false);
    }
    fetchPendingStores();
  }, []);

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

  async function handleProviderStatus(userId: string, isActive: boolean) {
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

  const totalStores = mockStores.length;
  const approvedStores = mockStores.filter(s => s.status === 'approved').length;
  const totalProviders = mockServiceProviders.length;
  const approvedProviders = mockServiceProviders.filter(p => p.status === 'approved').length;
  const totalTickets = mockTickets.length;
  const openTickets = mockTickets.filter(t => t.status === 'open').length;
  const inProgressTickets = mockTickets.filter(t => t.status === 'in_progress').length;
  const completedTickets = mockTickets.filter(t => t.status === 'completed').length;

  // Mock analytics data
  const categoryData = [
    { name: 'Facilities', value: 45, color: '#3B82F6' },
    { name: 'IT', value: 30, color: '#10B981' },
    { name: 'Equipment', value: 25, color: '#F59E0B' }
  ];

  const priorityData = [
    { name: 'High', value: 20, color: '#EF4444' },
    { name: 'Medium', value: 50, color: '#F59E0B' },
    { name: 'Low', value: 30, color: '#10B981' }
  ];

  // Mock data for analytics
  const ticketTrendData = [
    { date: '2024-06-01', tickets: 12 },
    { date: '2024-06-02', tickets: 18 },
    { date: '2024-06-03', tickets: 15 },
    { date: '2024-06-04', tickets: 22 },
    { date: '2024-06-05', tickets: 19 },
    { date: '2024-06-06', tickets: 25 },
    { date: '2024-06-07', tickets: 20 },
  ];
  const ticketStatusData = [
    { name: 'Open', value: 20 },
    { name: 'Assigned', value: 15 },
    { name: 'In Progress', value: 10 },
    { name: 'Completed', value: 40 },
    { name: 'Rejected', value: 5 },
  ];
  const slaData = [
    { date: '2024-06-01', sla: 92 },
    { date: '2024-06-02', sla: 94 },
    { date: '2024-06-03', sla: 91 },
    { date: '2024-06-04', sla: 95 },
    { date: '2024-06-05', sla: 93 },
    { date: '2024-06-06', sla: 96 },
    { date: '2024-06-07', sla: 94 },
  ];
  const techPerformanceData = [
    { name: 'Tech A', completed: 12 },
    { name: 'Tech B', completed: 9 },
    { name: 'Tech C', completed: 15 },
    { name: 'Tech D', completed: 7 },
    { name: 'Tech E', completed: 11 },
  ];

  if (!user) return null;

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
          <p className="text-gray-600 mt-1">
            Global monitoring and management across all stores
          </p>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Stores"
            value={totalStores}
            description={`${approvedStores} approved`}
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
            value="94.2%"
            icon={TrendingUp}
            color="green"
            trend={{ value: 2.1, isPositive: true }}
          />
        </div>

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
            </CardContent>
          </Card>

          {/* Issues by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Issues by Priority</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Ticket Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Compliance (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Technician Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
            </CardHeader>
            <CardContent>
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
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">New store registration: Austin Neighborhood Market</span>
                <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Service provider approved: Quick Fix Solutions</span>
                <span className="text-xs text-gray-500 ml-auto">4 hours ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm">SLA breach alert: Ticket #123 exceeded deadline</span>
                <span className="text-xs text-gray-500 ml-auto">6 hours ago</span>
              </div>
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
                    <div className="text-sm text-gray-600">Registered by: {storeUser.username} ({storeUser.email})</div>
                    <div className="text-sm text-gray-600">Legal Docs:</div>
                    <ul className="ml-4 list-disc">
                      {storeUser.documents.map((doc: any) => (
                        <li key={doc.id}>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{doc.type}</a>
                        </li>
                      ))}
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

        {/* Service Provider Management */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Service Provider Management</h2>
          {loadingProviders ? (
            <div>Loading...</div>
          ) : providers.length === 0 ? (
            <div className="text-gray-500">No service providers found.</div>
          ) : (
            <div className="space-y-4">
              {providers.map(provider => (
                <div key={provider.id} className="border rounded p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="font-semibold">{provider.service_provider?.company_name}</div>
                    <div className="text-sm text-gray-600">Company ID: {provider.service_provider?.unique_company_id}</div>
                    <div className="text-sm text-gray-600">Location: {provider.service_provider?.primary_location_address}</div>
                    <div className="text-sm text-gray-600">Registered by: {provider.username} ({provider.email})</div>
                    <div className="text-sm text-gray-600">Status: <span className={`font-semibold ${provider.is_active ? 'text-green-600' : 'text-red-600'}`}>{provider.is_active ? 'Active' : 'Inactive'}</span> | <span className="font-semibold">{provider.registration_status}</span></div>
                    <div className="text-sm text-gray-600">Docs:</div>
                    <ul className="ml-4 list-disc">
                      {provider.documents.map((doc: any) => (
                        <li key={doc.id}>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{doc.type}</a>
                        </li>
                      ))}
                    </ul>
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
                  {users.map(user => (
                    <tr key={user.id} className="border-b">
                      <td className="p-2 border">{user.username}</td>
                      <td className="p-2 border">{user.email}</td>
                      <td className="p-2 border">{user.role}</td>
                      <td className="p-2 border">
                        <span className={`font-semibold ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>{user.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="p-2 border">{user.registration_status}</td>
                      <td className="p-2 border">
                        <button
                          className={`px-3 py-1 rounded font-semibold ${user.is_active ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                          onClick={() => handleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
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
}