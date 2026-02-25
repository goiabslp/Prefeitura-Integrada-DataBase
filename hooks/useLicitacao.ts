import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Order } from '../types';
import * as licitacaoService from '../services/licitacaoService';

export const licitacaoKeys = {
    all: ['licitacao'] as const,
    lists: () => [...licitacaoKeys.all, 'list'] as const,
    list: (filters: string) => [...licitacaoKeys.lists(), { filters }] as const,
    details: () => [...licitacaoKeys.all, 'detail'] as const,
    detail: (id: string) => [...licitacaoKeys.details(), id] as const,
};

export const useLicitacaoProcesses = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('realtime:licitacao_processes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'licitacao_processes' },
                () => {
                    queryClient.invalidateQueries({ queryKey: licitacaoKeys.lists() });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: licitacaoKeys.lists(),
        queryFn: () => licitacaoService.getAllLicitacaoProcesses(true),
        staleTime: 1000 * 60 * 5,
    });
};

export const useInfiniteLicitacao = (pageSize = 20, searchTerm = '', status?: string) => {
    return useInfiniteQuery({
        queryKey: [...licitacaoKeys.lists(), 'infinite', { searchTerm, status }],
        queryFn: async ({ pageParam = 0 }) => {
            return licitacaoService.getAllLicitacaoProcesses(true, pageParam as number, pageSize, searchTerm, status);
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === pageSize ? allPages.length : undefined;
        },
        initialPageParam: 0,
        staleTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
    });
};

export const useLicitacaoProcess = (id: string | null) => {
    return useQuery({
        queryKey: licitacaoKeys.detail(id || ''),
        queryFn: () => licitacaoService.getLicitacaoProcessById(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 30,
    });
};

export const useCreateLicitacaoProcess = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: licitacaoService.saveLicitacaoProcess,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: licitacaoKeys.lists() });
        },
    });
};

export const useUpdateLicitacaoProcess = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: licitacaoService.saveLicitacaoProcess,
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: licitacaoKeys.lists() });
            queryClient.invalidateQueries({ queryKey: licitacaoKeys.detail(variables.id) });
        },
    });
};

export const useDeleteLicitacaoProcess = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: licitacaoService.deleteLicitacaoProcess,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: licitacaoKeys.lists() });
        },
    });
};
