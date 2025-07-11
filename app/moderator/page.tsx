'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricsCard from '@/components/dashboard/MetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Ticket, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  UserCheck
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { mockTickets, mockServiceProviders, mockStores } from '@/lib/mockData';
import { ChartContainer } from '@/components/ui/chart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function ModeratorDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const { toast } = useToast();

  // Get store for this moderator
  const myStore = mockStores.find(s => s.moderator_user_id === user?.id);
  
  // Filter data for this store
  const storeTickets = mockTickets.filter(t => t.store_id === myStore?.id);
  const storeProviders = mockServiceProviders.filter(p => 
    p.approved_by_moderator_id === user?.id || p.status === 'pending_approval'
  );

  const openTickets = storeTickets.filter(t => t.status === 'open').length;
  const inProgressTickets = storeTickets.filter(t => t.status === 'in_progress').length;
  const completedTickets = storeTickets.filter(t => t.status === 'completed').length;
  const pendingProviders = storeProviders.filter(p => p.status === 'pending_approval').length;

  // Mock data for analytics
  const ticketTrendData = [
    { date: '2024-06-01', tickets: 2 },
    { date: '2024-06-02', tickets: 3 },
    { date: '2024-06-03', tickets: 1 },
    { date: '2024-06-04', tickets: 4 },
    { date: '2024-06-05', tickets: 2 },
    { date: '2024-06-06', tickets: 5 },
    { date: '2024-06-07', tickets: 3 },
  ];
  const ticketStatusData = [
    { name: 'Open', value: openTickets },
    { name: 'In Progress', value: inProgressTickets },
    { name: 'Completed', value: completedTickets },
  ];
  const slaData = [
    { date: '2024-06-01', sla: 97 },
    { date: '2024-06-02', sla: 95 },
    { date: '2024-06-03', sla: 96 },
    { date: '2024-06-04', sla: 98 },
    { date: '2024-06-05', sla: 94 },
    { date: '2024-06-06', sla: 99 },
    { date: '2024-06-07', sla: 97 },
  ];
  const techPerformanceData = [
    { name: 'Tech A', completed: 3 },
    { name: 'Tech B', completed: 2 },
    { name: 'Tech C', completed: 4 },
  ];

  // Pending Provider Approvals State
  const [pendingProvidersList, setPendingProvidersList] = useState<any[]>(storeProviders.filter(p => p.status === 'pending_approval'));
  const [providerActionMsg, setProviderActionMsg] = useState("");
  const [loadingPendingProviders, setLoadingPendingProviders] = useState(false);

  async function handleProviderAction(providerId: string, action: 'APPROVE' | 'REJECT') {
    setProviderActionMsg('');
    setLoadingPendingProviders(true);
    const res = await fetch('/api/auth/register', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: providerId, action })
    });
    const data = await res.json();
    if (res.ok) {
      setProviderActionMsg(`Provider ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
      setPendingProvidersList(pendingProvidersList.filter(p => p.id !== providerId));
    } else {
      setProviderActionMsg(data.error || 'Action failed.');
    }
    setLoadingPendingProviders(false);
  }

  // Approved Providers State
  const approvedProvidersList = storeProviders.filter(p => p.status === 'approved');

  // State for Send Notice modal
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeProvider, setNoticeProvider] = useState<any>(null);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeFeedback, setNoticeFeedback] = useState('');
  const [removingProviderId, setRemovingProviderId] = useState<string | null>(null);

  function persistProviderRemoval(providerId: string) {
    const removed = JSON.parse(localStorage.getItem('moderator_removed_providers') || '[]');
    removed.unshift({ providerId, timestamp: new Date().toISOString() });
    localStorage.setItem('moderator_removed_providers', JSON.stringify(removed.slice(0, 50)));
  }
  function persistNotice(providerId: string, message: string) {
    const notices = JSON.parse(localStorage.getItem('moderator_sent_notices') || '[]');
    notices.unshift({ providerId, message, timestamp: new Date().toISOString() });
    localStorage.setItem('moderator_sent_notices', JSON.stringify(notices.slice(0, 50)));
  }

  async function handleRemoveProvider(providerId: string) {
    if (!window.confirm('Are you sure you want to remove this provider from your store?')) return;
    setRemovingProviderId(providerId);
    setTimeout(() => {
      setRemovingProviderId(null);
      persistProviderRemoval(providerId);
      toast({
        title: 'Provider Removed',
        description: 'The provider has been removed from your store.',
      });
      window.location.reload();
    }, 1000);
  }

  async function handleSendNotice() {
    if (!noticeProvider || !noticeMessage.trim()) return;
    setNoticeFeedback('Sending...');
    setTimeout(() => {
      setNoticeFeedback('Notice sent successfully!');
      persistNotice(noticeProvider.id, noticeMessage);
      toast({
        title: 'Notice Sent',
        description: 'Your notice/complaint has been sent to the provider.',
      });
      setTimeout(() => {
        setNoticeModalOpen(false);
        setNoticeFeedback('');
        setNoticeMessage('');
        setNoticeProvider(null);
      }, 1200);
    }, 1000);
  }

  useEffect(() => {
    if (!user || user.role !== 'moderator') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || !myStore) return null;

  return (
    <DashboardLayout title="Moderator Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600 mt-1">
            {myStore.name} - Store ID: {myStore.store_id}
          </p>
        </div>

        {/* Store Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Store Tickets"
            value={storeTickets.length}
            icon={Ticket}
            color="blue"
            trend={{ value: 15, isPositive: true }}
          />
          <MetricsCard
            title="Open Issues"
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
            color="purple"
          />
          <MetricsCard
            title="Completed"
            value={completedTickets}
            description="Successfully resolved"
            icon={CheckCircle2}
            color="green"
          />
        </div>

        {/* Store Analytics */}
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
                      <Cell key={`cell-${index}`} fill={["#3B82F6", "#10B981", "#F59E0B"][index % 3]} />
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
                  <YAxis domain={[90, 100]} />
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

        {/* Pending Provider Approvals */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Provider Approvals</h2>
          {loadingPendingProviders ? (
            <div>Loading...</div>
          ) : pendingProvidersList.length === 0 ? (
            <div className="text-gray-500">No pending provider registrations.</div>
          ) : (
            <div className="space-y-4">
              {pendingProvidersList.map(provider => (
                <div key={provider.id} className="border rounded p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="font-semibold">{provider.company_name}</div>
                    <div className="text-sm text-gray-600">Company ID: {provider.unique_company_id}</div>
                    <div className="text-sm text-gray-600">Location: {provider.primary_location_address}</div>
                    <div className="text-sm text-gray-600">Skills: {provider.skills.join(', ')}</div>
                    <div className="text-sm text-gray-600">Docs:</div>
                    <ul className="ml-4 list-disc">
                      {Array.isArray((provider as any).documents) ? (provider as any).documents.map((doc: any) => (
                        <li key={doc.id}>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{doc.type}</a>
                        </li>
                      )) : null}
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
          {providerActionMsg && <div className="mt-2 text-sm text-blue-700">{providerActionMsg}</div>}
        </div>

        {/* Approved Providers */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Approved Providers</h2>
          {approvedProvidersList.length === 0 ? (
            <div className="text-gray-500">No approved providers for your store.</div>
          ) : (
            <div className="space-y-4">
              {approvedProvidersList.map(provider => {
                const p = provider as any;
                return (
                  <div key={p.id} className="border rounded p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="font-semibold">{p.company_name}</div>
                      <div className="text-sm text-gray-600">Company ID: {p.unique_company_id}</div>
                      <div className="text-sm text-gray-600">Location: {p.primary_location_address}</div>
                      <div className="text-sm text-gray-600">Skills: {p.skills.join(', ')}</div>
                      <div className="text-sm text-gray-600">Docs:</div>
                      <ul className="ml-4 list-disc">
                        {Array.isArray(p.documents) ? p.documents.map((doc: any) => (
                          <li key={doc.id}>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{doc.type}</a>
                          </li>
                        )) : null}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
                        disabled={removingProviderId === p.id}
                        onClick={() => handleRemoveProvider(p.id)}
                      >
                        {removingProviderId === p.id ? 'Removing...' : 'Remove'}
                      </button>
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
                        onClick={() => { setNoticeProvider(p); setNoticeModalOpen(true); }}
                      >
                        Send Notice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Notice Modal */}
          <Dialog open={noticeModalOpen} onOpenChange={setNoticeModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Notice to Provider</DialogTitle>
              </DialogHeader>
              <div className="mb-2 text-gray-700 font-semibold">{noticeProvider?.company_name}</div>
              <Textarea
                className="w-full mb-3"
                rows={4}
                placeholder="Enter your message or complaint..."
                value={noticeMessage}
                onChange={e => setNoticeMessage(e.target.value)}
              />
              {noticeFeedback && <div className="mb-2 text-blue-700 text-sm">{noticeFeedback}</div>}
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold"
                  onClick={() => setNoticeModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  onClick={handleSendNotice}
                  disabled={!noticeMessage.trim() || !!noticeFeedback}
                >
                  Send
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Provider Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Service Providers
              </CardTitle>
              {pendingProviders > 0 && (
                <Badge variant="destructive">{pendingProviders} pending</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {storeProviders.slice(0, 5).map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{provider.company_name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {provider.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={provider.status === 'approved' ? 'default' : 'secondary'}
                        className={provider.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {provider.status === 'pending_approval' ? 'Pending' : 'Approved'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                <UserCheck className="h-4 w-4 mr-2" />
                Manage Providers
              </Button>
            </CardContent>
          </Card>

          {/* Store Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Store Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">SLA Compliance</span>
                    <span className="text-sm font-semibold text-green-600">96.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '96.5%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Avg. Resolution Time</span>
                    <span className="text-sm font-semibold">4.2 hours</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-green-600 font-medium">
                    ↑ 8% improvement this month
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Compared to previous period
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Store Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Store Activity</CardTitle>
            <Button variant="outline" onClick={() => router.push('/moderator/tickets')}>
              <Eye className="h-4 w-4 mr-2" />
              View All Tickets
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storeTickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">#{ticket.id}</span>
                      <Badge variant="outline" className={
                        ticket.ai_priority === 'high' ? 'border-red-200 text-red-800' :
                        ticket.ai_priority === 'medium' ? 'border-yellow-200 text-yellow-800' :
                        'border-green-200 text-green-800'
                      }>
                        {ticket.ai_priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={
                        ticket.status === 'completed' ? 'border-green-200 text-green-800' :
                        ticket.status === 'in_progress' ? 'border-yellow-200 text-yellow-800' :
                        'border-blue-200 text-blue-800'
                      }>
                        {ticket.status.toUpperCase().replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-1">
                      {ticket.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {ticket.location_in_store} • {ticket.ai_classification_category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
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