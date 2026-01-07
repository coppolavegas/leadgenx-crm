'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Client } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';

interface ClientSwitcherProps {
  selectedClientId?: string;
  onClientChange?: (clientId: string) => void;
}

export function ClientSwitcher({ selectedClientId, onClientChange }: ClientSwitcherProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await apiClient.getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    if (onClientChange) {
      onClientChange(clientId);
    } else {
      router.push(`/crm/${clientId}`);
    }
  };

  if (loading) {
    return <div className="w-64 h-10 bg-gray-200 animate-pulse rounded-md" />;
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-5 w-5 text-gray-500" />
      <Select value={selectedClientId} onValueChange={handleClientChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select a client workspace" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex flex-col">
                <span className="font-medium">{client.name}</span>
                {client.industry && (
                  <span className="text-xs text-gray-500">{client.industry}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        onClick={() => router.push('/clients')}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
