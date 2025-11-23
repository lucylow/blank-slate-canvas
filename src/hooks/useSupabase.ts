// React hooks for Supabase operations
import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { safeQuery, safeMutation, handleSupabaseError, type PaginatedResult, type PaginationOptions } from '@/integrations/supabase/utils';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Hook for querying Supabase with React Query
 */
export function useSupabaseQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) {
        handleSupabaseError(error);
      }
      return data as T;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 60000, // 1 minute default
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Hook for Supabase mutations with React Query
 */
export function useSupabaseMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: PostgrestError | null }>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: PostgrestError) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const { data, error } = await mutationFn(variables);
      if (error) {
        handleSupabaseError(error);
      }
      return data as TData;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: (error) => {
      options?.onError?.(error as PostgrestError);
    },
  });
}

/**
 * Hook for realtime subscriptions
 */
export function useRealtimeSubscription<T>(
  channelName: string,
  table: string,
  filter?: string,
  onInsert?: (payload: T) => void,
  onUpdate?: (payload: T) => void,
  onDelete?: (payload: T) => void
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new as T);
              break;
            case 'UPDATE':
              onUpdate?.(payload.new as T);
              break;
            case 'DELETE':
              onDelete?.(payload.old as T);
              break;
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [channelName, table, filter, onInsert, onUpdate, onDelete]);

  const unsubscribe = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setIsConnected(false);
    }
  }, [channel]);

  return { channel, isConnected, unsubscribe };
}

/**
 * Hook for paginated queries
 */
export function usePaginatedQuery<T>(
  queryKey: string[],
  queryFn: (options: PaginationOptions) => Promise<PaginatedResult<T>>,
  initialPage: number = 1,
  pageSize: number = 20
) {
  const [page, setPage] = useState(initialPage);

  const query = useQuery({
    queryKey: [...queryKey, page, pageSize],
    queryFn: () => queryFn({ page, pageSize }),
  });

  const nextPage = useCallback(() => {
    const data = query.data;
    if (data && page < data.totalPages) {
      setPage(page + 1);
    }
  }, [page, query.data]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    const data = query.data;
    if (data && newPage >= 1 && newPage <= data.totalPages) {
      setPage(newPage);
    }
  }, [query.data]);

  return {
    ...query,
    page,
    pageSize,
    nextPage,
    previousPage,
    goToPage,
  };
}

/**
 * Hook to get current Supabase user
 */
export function useSupabaseUser() {
  const [user, setUser] = useState(supabase.auth.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

