
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { queryClient } from './services/queryClient';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours persistence
        }}
      >
        <App />
      </PersistQueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);
