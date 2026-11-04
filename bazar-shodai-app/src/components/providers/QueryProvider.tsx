import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, clientPersister } from '@/api/queryClient';

export interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: clientPersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        buster: 'v1.0.0',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

