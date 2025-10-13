// src/hooks/useVehicleCounts.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { livestreamApi } from '@/api/livestream_api';
import type { VehicleCounts } from '@/types/livestream.types';

interface UseVehicleCountsProps {
  isStreaming: boolean;
  pollingInterval?: number;
}

export function useVehicleCounts({ 
  isStreaming, 
  pollingInterval = 2000 
}: UseVehicleCountsProps) {
  const [counts, setCounts] = useState<VehicleCounts>({
    car: 0,
    truck: 0,
    bicycle: 0,
    motorbike: 0,
    jeepney: 0,
    tricycle: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isStreaming) return;

    try {
      const data = await livestreamApi.getStats();
      setCounts(data.vehicle_counts);
      setTotalCount(data.total_count);
    } catch (error) {
      console.debug('Stats fetch skipped or failed', error);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      fetchStats(); // Fetch immediately on start
      intervalRef.current = setInterval(fetchStats, pollingInterval);
    } else {
      // Reset counts when stopped
      setCounts({ car: 0, truck: 0, bicycle: 0, motorbike: 0, jeepney: 0, tricycle: 0 });
      setTotalCount(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isStreaming, fetchStats, pollingInterval]);

  return {
    counts,
    totalCount
  };
}