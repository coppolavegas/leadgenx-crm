'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, Plus, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';

interface Client {
  id: string;
  name: string;
  status: string;
}

interface ClientSwitcherProps {
  currentClientId?: string;
  onClientChange?: (clientId: string) => void;
}

export function ClientSwitcher({ currentClientId, onClientChange }: ClientSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(currentClientId);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://leadgenx.app';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE}/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch clients');
      
      const data = await response.json();
      setClients(data);
      
      // Set first client as selected if none specified
      if (!selectedClientId && data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsOpen(false);
    
    if (onClientChange) {
      onClientChange(clientId);
    }
    
    // Refresh current page with new client context
    router.refresh();
  };

  const handleCreateClient = () => {
    setIsOpen(false);
    router.push('/clients?action=create');
  };

  const currentClient = clients.find(c => c.id === selectedClientId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141824]/50">
        <Building2 className="w-4 h-4 text-[#8B90A0]" />
        <span className="text-sm text-[#8B90A0]">Loading...</span>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <Button 
        variant="glass" 
        size="sm" 
        onClick={handleCreateClient}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Create First Client
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141824]/50 hover:bg-[#141824] border border-[#8B90A0]/20 hover:border-[#6E4AFF]/50 transition-all"
      >
        <Building2 className="w-4 h-4 text-[#6E4AFF]" />
        <div className="flex flex-col items-start">
          <span className="text-xs text-[#8B90A0]">Current Client</span>
          <span className="text-sm font-medium text-[#EDEEF2]">
            {currentClient?.name || 'Select Client'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#8B90A0] transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <GlassPanel 
            intensity="strong" 
            className="absolute top-full mt-2 right-0 w-72 max-h-96 overflow-auto z-50"
          >
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-[#8B90A0] mb-1">
                Switch Client
              </div>
              
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    client.id === selectedClientId
                      ? 'bg-[#6E4AFF]/20 text-[#EDEEF2]'
                      : 'hover:bg-[#8B90A0]/10 text-[#EDEEF2]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium">{client.name}</div>
                      <div className="text-xs text-[#8B90A0] capitalize">{client.status}</div>
                    </div>
                  </div>
                  {client.id === selectedClientId && (
                    <Check className="w-4 h-4 text-[#6E4AFF]" />
                  )}
                </button>
              ))}
              
              <div className="border-t border-[#8B90A0]/20 mt-2 pt-2">
                <button
                  onClick={handleCreateClient}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#8B90A0]/10 text-[#EDEEF2] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Create New Client</span>
                </button>
              </div>
            </div>
          </GlassPanel>
        </>
      )}
    </div>
  );
}