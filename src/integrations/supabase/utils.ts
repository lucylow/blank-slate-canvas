// Utility functions for Supabase operations
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './client';

export interface SupabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

/**
 * Handle Supabase errors with better error messages
 */
export function handleSupabaseError(error: PostgrestError | null): void {
  if (!error) return;

  const supabaseError: SupabaseError = {
    name: 'SupabaseError',
    message: error.message || 'An unknown error occurred',
    code: error.code,
    details: error.details,
    hint: error.hint,
  };

  console.error('Supabase Error:', {
    message: supabaseError.message,
    code: supabaseError.code,
    details: supabaseError.details,
    hint: supabaseError.hint,
  });

  throw supabaseError;
}

/**
 * Safely execute a Supabase query with error handling
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await queryFn();
  
  if (error) {
    handleSupabaseError(error);
  }

  if (!data) {
    throw new Error('Query returned no data');
  }

  return data;
}

/**
 * Safely execute a Supabase mutation with error handling
 */
export async function safeMutation<T>(
  mutationFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  return safeQuery(mutationFn);
}

/**
 * Create a pagination helper for Supabase queries
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Execute a paginated query
 */
export async function paginatedQuery<T>(
  query: ReturnType<typeof supabase.from>,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { page, pageSize } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  const { count } = await query.select('*', { count: 'exact', head: true });
  const total = count || 0;

  // Get paginated data
  const { data, error } = await query.select('*').range(from, to);

  if (error) {
    handleSupabaseError(error);
  }

  return {
    data: (data || []) as T[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Retry a Supabase operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Check if Supabase is available (client-side only)
 */
export function isSupabaseAvailable(): boolean {
  return typeof window !== 'undefined' && 
         !!import.meta.env.VITE_SUPABASE_URL && 
         !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}


