import { QueryClient } from '@tanstack/react-query';

// Optimized for minimal requests and offline-first experience
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 10, // 10 minutes (Data remains "fresh" longer)
            gcTime: 1000 * 60 * 60 * 24, // 24 hours (Keep in cache/storage)
            retry: 1,
            refetchOnWindowFocus: false, // Prevent aggressive refetching
            refetchOnMount: true, // Ensure fresh data on navigation/reload
            refetchOnReconnect: true, // Sync when connection returns
        },
    },
});
