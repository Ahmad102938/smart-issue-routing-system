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
    if (!user || user.role !== 'store_register') {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <DashboardLayout title="Report Issue">
      <CreateTicketForm />
    </DashboardLayout>
  );
}