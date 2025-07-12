'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TicketList from '@/components/tickets/TicketList';
import TicketDetail from '@/components/tickets/TicketDetail';
import { getCurrentUser } from '@/lib/auth';
import { Ticket } from '@/types';

export default function StoreTicketsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    if ((user.role as string) !== 'STORE_REGISTER') {
      router.push('/');
      return;
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <DashboardLayout title="My Tickets">
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