'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateTicketForm from '@/components/tickets/CreateTicketForm';
import { getCurrentUser } from '@/lib/auth';

export default function CreateTicketPage() {
  const router = useRouter();
  const user = getCurrentUser();

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
    <DashboardLayout title="Report Issue">
      <CreateTicketForm />
    </DashboardLayout>
  );
}