'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function InboxRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the first available client's inbox
    const redirectToInbox = async () => {
      try {
        const clients = await apiClient.getClients();
        if (clients && clients.length > 0) {
          router.replace(`/inbox/${clients[0].id}`);
        } else {
          router.replace('/clients');
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        router.replace('/clients');
      }
    };

    redirectToInbox();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600" />
    </div>
  );
}
