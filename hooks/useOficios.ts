import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as oficiosService from '../services/oficiosService';
import { Order } from '../types';
import { supabase } from '../services/supabaseClient';

const oficioKeys = {
    all: ['oficios'] as const,
    lists: () => [...oficioKeys.all, 'list'] as const,
    // You can add more specific keys if needed, e.g.,
    // detail: (id: string) => [...oficioKeys.all, 'detail', id] as const,
};

// Hook to fetch all oficios
export const useOficios = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('realtime:oficios')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'oficios' },
                () => {
                    queryClient.invalidateQueries({ queryKey: oficioKeys.lists() });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Optional: console.log('Oficios realtime connected');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: oficioKeys.lists(),
        queryFn: oficiosService.getAllOficios,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// Hook to fetch single oficio
export const useOficio = (id: string | null) => {
    return useQuery({
        queryKey: ['oficios', 'detail', id],
        queryFn: () => oficiosService.getOficioById(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useCreateOficio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: oficiosService.saveOficio,
        onMutate: async (newOficio) => {
            // Check for strictly new items vs updates (though saveOficio handles upsert)
            // For optimistic UI on CREATE, we need a temporary ID if one isn't provided, 
            // but usually the app generates one before saving.

            await queryClient.cancelQueries({ queryKey: oficioKeys.lists() });
            const previousOficios = queryClient.getQueryData<Order[]>(oficioKeys.lists());

            if (previousOficios) {
                queryClient.setQueryData<Order[]>(oficioKeys.lists(), (old) => {
                    return old ? [newOficio, ...old] : [newOficio];
                });
            }

            return { previousOficios };
        },
        onError: (_err, _newOficio, context) => {
            if (context?.previousOficios) {
                queryClient.setQueryData(oficioKeys.lists(), context.previousOficios);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: oficioKeys.lists() });
        },
    });
};

export const useUpdateOficio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: oficiosService.saveOficio,
        onMutate: async (updatedOficio) => {
            await queryClient.cancelQueries({ queryKey: oficioKeys.lists() });
            const previousOficios = queryClient.getQueryData<Order[]>(oficioKeys.lists());

            if (previousOficios) {
                queryClient.setQueryData<Order[]>(oficioKeys.lists(), (old) =>
                    old?.map((oficio) => (oficio.id === updatedOficio.id ? updatedOficio : oficio))
                );
            }

            return { previousOficios };
        },
        onError: (_err, _updatedOficio, context) => {
            if (context?.previousOficios) {
                queryClient.setQueryData(oficioKeys.lists(), context.previousOficios);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: oficioKeys.lists() });
        },
    });
};

export const useDeleteOficio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: oficiosService.deleteOficio,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: oficioKeys.lists() });
            const previousOficios = queryClient.getQueryData<Order[]>(oficioKeys.lists());

            if (previousOficios) {
                queryClient.setQueryData<Order[]>(oficioKeys.lists(), (old) =>
                    old?.filter((oficio) => oficio.id !== id)
                );
            }

            return { previousOficios };
        },
        onError: (_err, _id, context) => {
            if (context?.previousOficios) {
                queryClient.setQueryData(oficioKeys.lists(), context.previousOficios);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: oficioKeys.lists() });
        },
    });
};

export const useUpdateOficioDescription = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, description }: { id: string; description: string }) => oficiosService.updateOficioDescription(id, description),
        onMutate: async ({ id, description }) => {
            await queryClient.cancelQueries({ queryKey: oficioKeys.lists() });
            const previousOficios = queryClient.getQueryData<Order[]>(oficioKeys.lists());

            if (previousOficios) {
                queryClient.setQueryData<Order[]>(oficioKeys.lists(), (old) =>
                    old?.map((oficio) => (oficio.id === id ? { ...oficio, description } : oficio))
                );
            }

            return { previousOficios };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousOficios) {
                queryClient.setQueryData(oficioKeys.lists(), context.previousOficios);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: oficioKeys.lists() });
        },
    });
};
