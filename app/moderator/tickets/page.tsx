'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TicketList from '@/components/tickets/TicketList';
import TicketDetail from '@/components/tickets/TicketDetail';
import { getCurrentUser } from '@/lib/auth';
import { Ticket } from '@/types';

export default function ModeratorTicketsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'moderator') {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <DashboardLayout title="Store Tickets">
      {selectedTicket ? (
        <TicketDetail 
          ticket={selectedTicket} 
          onBack={() => setSelectedTicket(null)} 
        />
      ) : (
        <TicketList onTicketSelect={setSelectedTicket} />
      )}
    </DashboardLayout>
  );
}