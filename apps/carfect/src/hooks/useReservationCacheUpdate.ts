import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Returns a function that invalidates all cached reservation queries,
 * triggering a background refetch. Use after a successful DB write
 * so the calendar updates with fresh data.
 */
export function useReservationCacheUpdate() {
  const queryClient = useQueryClient();

  const invalidateReservations = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['reservations'],
      exact: false,
    });
  }, [queryClient]);

  return { invalidateReservations };
}
