import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Order } from '../types';
import * as comprasService from '../services/comprasService';

// Keys
export const purchaseOrderKeys = {
    all: ['purchaseOrders'] as const,
    lists: () => [...purchaseOrderKeys.all, 'list'] as const,
    list: (filters: string) => [...purchaseOrderKeys.lists(), { filters }] as const,
    details: () => [...purchaseOrderKeys.all, 'detail'] as const,
    detail: (id: string) => [...purchaseOrderKeys.details(), id] as const,
};

// Hook to fetch lightweight list
export const usePurchaseOrders = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('realtime:purchase_orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'purchase_orders' },
                () => {
                    queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: purchaseOrderKeys.lists(),
        queryFn: async () => {
            // Updated service call to fetch ONLY lightweight fields
            return comprasService.getAllPurchaseOrders(true); // true = lightweight
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// Hook for Infinite Scroll History (No Realtime, Optimized)
import { useInfiniteQuery } from '@tanstack/react-query';

export const useInfinitePurchaseOrders = (pageSize = 20) => {
    return useInfiniteQuery({
        queryKey: [...purchaseOrderKeys.lists(), 'infinite'],
        queryFn: async ({ pageParam = 0 }) => {
            return comprasService.getAllPurchaseOrders(true, pageParam as number, pageSize);
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === pageSize ? allPages.length : undefined;
        },
        initialPageParam: 0,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
        refetchOnWindowFocus: false,
    });
};

// Hook to fetch single full detail
export const usePurchaseOrder = (id: string | null) => {
    return useQuery({
        queryKey: purchaseOrderKeys.detail(id || ''),
        queryFn: () => comprasService.getPurchaseOrderById(id!),
        enabled: !!id, // Only fetch if ID is present
        staleTime: 1000 * 60 * 30, // 30 minutes for individual docs
    });
};

// Mutations
export const useCreatePurchaseOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: comprasService.savePurchaseOrder,
        onMutate: async (newOrder) => {
            await queryClient.cancelQueries({ queryKey: purchaseOrderKeys.lists() });
            const previousOrders = queryClient.getQueryData<Order[]>(purchaseOrderKeys.lists());

            // Optimistic Update
            if (previousOrders) {
                queryClient.setQueryData<Order[]>(purchaseOrderKeys.lists(), [
                    { ...newOrder, id: newOrder.id || 'temp-id', createdAt: new Date().toISOString() },
                    ...previousOrders,
                ]);
            }

            return { previousOrders };
        },
        onError: (err, newOrder, context) => {
            if (context?.previousOrders) {
                queryClient.setQueryData(purchaseOrderKeys.lists(), context.previousOrders);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
        },
    });
};

export const useUpdatePurchaseOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: comprasService.savePurchaseOrder, // Using save for upsert/update
        onMutate: async (updatedOrder) => {
            await queryClient.cancelQueries({ queryKey: purchaseOrderKeys.lists() });
            await queryClient.cancelQueries({ queryKey: purchaseOrderKeys.detail(updatedOrder.id) });

            const previousOrders = queryClient.getQueryData<Order[]>(purchaseOrderKeys.lists());
            const previousDetail = queryClient.getQueryData<Order>(purchaseOrderKeys.detail(updatedOrder.id));

            // Optimistic List Update
            if (previousOrders) {
                queryClient.setQueryData<Order[]>(purchaseOrderKeys.lists(),
                    previousOrders.map(order => order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order)
                );
            }

            // Optimistic Detail Update
            if (previousDetail) {
                queryClient.setQueryData<Order>(purchaseOrderKeys.detail(updatedOrder.id), { ...previousDetail, ...updatedOrder });
            }

            return { previousOrders, previousDetail };
        },
        onError: (err, updatedOrder, context) => {
            if (context?.previousOrders) {
                queryClient.setQueryData(purchaseOrderKeys.lists(), context.previousOrders);
            }
            if (context?.previousDetail) {
                queryClient.setQueryData(purchaseOrderKeys.detail(updatedOrder.id), context.previousDetail);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) });
        },
    });
};

export const useDeletePurchaseOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: comprasService.deletePurchaseOrder,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: purchaseOrderKeys.lists() });
            const previousOrders = queryClient.getQueryData<Order[]>(purchaseOrderKeys.lists());

            if (previousOrders) {
                queryClient.setQueryData<Order[]>(purchaseOrderKeys.lists(),
                    previousOrders.filter(order => order.id !== id)
                );
            }

            return { previousOrders };
        },
        onError: (err, id, context) => {
            if (context?.previousOrders) {
                queryClient.setQueryData(purchaseOrderKeys.lists(), context.previousOrders);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
        },
    });
};
