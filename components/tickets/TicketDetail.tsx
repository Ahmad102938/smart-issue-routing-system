'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Building2, 
  User, 
  Phone, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Ticket, Remark, ServiceProvider } from '@/types';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface TicketDetailProps {
  ticket: Ticket & { remarks?: Remark[]; assigned_provider?: ServiceProvider };
  onBack: () => void;
}

export default function TicketDetail({ ticket, onBack }: TicketDetailProps) {
  const [newRemark, setNewRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [acceptEmpId, setAcceptEmpId] = useState('');
  const [acceptPhone, setAcceptPhone] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { data: session } = useSession();
  // Debug log
  console.log('TicketDetail debug:', { ticket, session });
  const { toast } = useToast();

  // Use real data from the ticket object
  const store = ticket.store;
  const provider = ticket.assigned_provider;
  const ticketRemarks: Remark[] = Array.isArray(ticket.remarks) ? ticket.remarks : []; // Use real remarks from ticket
  // Get latest assignment info
  const latestAssignment = Array.isArray(ticket.assignments) && ticket.assignments.length > 0 ? ticket.assignments[0] : null;

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;
    
    setIsSubmitting(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would add to the database
    setNewRemark('');
    setIsSubmitting(false);
    if (session?.user?.role === 'STORE_REGISTER') {
      toast({
        title: 'New Remark Added',
        description: 'A new remark has been added to your ticket.',
      });
    }
    if (session?.user?.role === 'SERVICE_PROVIDER') {
      toast({
        title: 'Remark Added',
        description: 'Your remark has been added to the ticket.',
      });
    }
  };

  // Helper to refresh ticket data after action
  const refreshTicket = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/tickets?id=${ticket.id}`);
      if (res.ok) {
        // Optionally, you can call a prop or context to refresh parent list
        // For now, just reload the page
        window.location.reload();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptTicket = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emp_id: acceptEmpId, phone_number: acceptPhone })
      });
      if (!res.ok) throw new Error('Failed to accept ticket');
      toast({ title: 'Ticket Accepted', description: 'You have accepted this ticket assignment.' });
      setShowAcceptModal(false);
      setAcceptEmpId('');
      setAcceptPhone('');
      await refreshTicket();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to accept ticket', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectTicket = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (!res.ok) throw new Error('Failed to reject ticket');
      toast({ title: 'Ticket Rejected', description: 'You have rejected this ticket assignment.' });
      setShowRejectModal(false);
      setRejectReason('');
      await refreshTicket();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to reject ticket', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTicket = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/complete`, {
        method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete ticket');
      toast({ title: 'Ticket Completed', description: 'You have marked this ticket as completed.' });
      await refreshTicket();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to complete ticket', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected_by_tech': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSLATimeRemaining = () => {
    const now = new Date();
    const deadline = new Date(ticket.sla_deadline);
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'SLA Exceeded';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.id}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getPriorityColor(ticket.ai_priority)}>
              {ticket.ai_priority.toUpperCase()} PRIORITY
            </Badge>
            <Badge variant="outline" className={getStatusColor(ticket.status)}>
              {ticket.status.toUpperCase().replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Problem Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{ticket.location_in_store}</span>
                </div>
                {ticket.qr_asset_id && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {ticket.qr_asset_id}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {ticket.ai_classification_category}
                </Badge>
                <Badge variant="outline">
                  {ticket.ai_classification_subcategory}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Service Provider Actions */}
          {session?.user?.role === 'SERVICE_PROVIDER' && ticket.assigned_service_provider_id === session.user.associated_provider_id && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {ticket.status === 'ASSIGNED' && (
                    <>
                      <Button
                        onClick={() => setShowAcceptModal(true)}
                        disabled={isSubmitting || refreshing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Accept Ticket
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectModal(true)}
                        disabled={isSubmitting || refreshing}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Ticket
                      </Button>
                    </>
                  )}
                  
                  {ticket.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={handleCompleteTicket}
                      disabled={isSubmitting || refreshing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remarks Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Remarks & Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Remark (for technicians) */}
              {session?.user?.role === 'SERVICE_PROVIDER' && ticket.status === 'IN_PROGRESS' && (
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <Textarea
                    placeholder="Add a remark about your progress..."
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddRemark}
                    disabled={!newRemark.trim() || isSubmitting}
                    size="sm"
                  >
                    Add Remark
                  </Button>
                </div>
              )}

              {/* Existing Remarks */}
              <div className="space-y-3">
                {ticketRemarks.map((remark: Remark) => (
                  <div key={remark.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {remark.user_id === '2' ? 'JD' : 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {remark.user_id === '2' ? 'John Doe (Technician)' : 'System'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(remark.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{remark.remark_text}</p>
                  </div>
                ))}

                {ticketRemarks.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No remarks yet. Updates will appear here.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDateTime(ticket.created_at)}</span>
                </div>
                {ticket.assigned_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned:</span>
                    <span className="font-medium">{formatDateTime(ticket.assigned_at)}</span>
                  </div>
                )}
                {ticket.accepted_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accepted:</span>
                    <span className="font-medium">{formatDateTime(ticket.accepted_at)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">SLA Deadline:</span>
                  <span className="font-medium">{formatDateTime(ticket.sla_deadline)}</span>
                </div>
                <Alert className={ticket.status !== 'completed' && new Date() > new Date(ticket.sla_deadline) ? 'border-red-200' : ''}>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>SLA Status:</strong> {getSLATimeRemaining()}
                  </AlertDescription>
                </Alert>
                {/* Assignment Info */}
                {latestAssignment && latestAssignment.status === 'ACCEPTED' && (
                  <div className="p-3 rounded bg-emerald-50 border border-emerald-200 mt-2">
                    <div className="font-semibold text-emerald-700 mb-1">Technician Accepted</div>
                    <div>Employee ID: <span className="font-mono">{latestAssignment.accepted_emp_id}</span></div>
                    <div>Phone: <span className="font-mono">{latestAssignment.accepted_phone_number}</span></div>
                  </div>
                )}
                {latestAssignment && latestAssignment.status === 'REJECTED' && (
                  <div className="p-3 rounded bg-red-50 border border-red-200 mt-2">
                    <div className="font-semibold text-red-700 mb-1">Technician Rejected</div>
                    <div>Reason: <span className="font-mono">{latestAssignment.rejection_reason}</span></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Store Information */}
          {store && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{store.name}</h4>
                  <p className="text-sm text-gray-600">Store ID: {store.store_id}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{store.address}</p>
                  <p>{store.city}, {store.state} {store.zip_code}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Technician */}
          {provider && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Assigned Technician
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {provider.company_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-gray-900">{provider.company_name}</h4>
                    <p className="text-sm text-gray-600">Service Provider</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {provider && (
                    <div>
                      <span className="text-gray-600">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(provider.skills) ? provider.skills : typeof provider.skills === 'string' ? provider.skills.split(',') : []).map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {provider && (
                    <div>
                      <span className="text-gray-600">Capacity:</span>
                      <span className="ml-1 font-medium">
                        {provider.current_load}/{provider.capacity_per_day} tickets
                      </span>
                    </div>
                  )}
                </div>

                {ticket.status === 'in_progress' && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Contact Information:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>Available after acceptance</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Accept Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Employee ID"
              value={acceptEmpId}
              onChange={e => setAcceptEmpId(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              placeholder="Phone Number"
              value={acceptPhone}
              onChange={e => setAcceptPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleAcceptTicket}
              disabled={!acceptEmpId || !acceptPhone || isSubmitting}
            >
              Accept
            </Button>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleRejectTicket}
              disabled={!rejectReason || isSubmitting}
              variant="destructive"
            >
              Reject
            </Button>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}