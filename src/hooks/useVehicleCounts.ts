// src/hooks/useVehicleCounts.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { livestreamApi, type DetectionUpdateMessage } from '@/api/livestream_api';
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
    motorcycle: 0,
    jeepney: 0,
    tricycle: 0,
  });
  const [totalCount, setTotalCount] = useState(0);

  const httpPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsUnsubscribeRef = useRef<(() => void) | null>(null);
  const wsConnectedRef = useRef(false);

  // Handle WebSocket updates for stats
  const handleWebSocketUpdate = useCallback((message: DetectionUpdateMessage) => {
    try {
      setCounts(message.data.stats.vehicle_counts as unknown as VehicleCounts);
      setTotalCount(message.data.stats.total_count);
    } catch (error) {
      console.error('Error processing WebSocket stats:', error);
    }
  }, []);

  // HTTP fallback for stats (if WebSocket fails)
  const fetchStatsHttp = useCallback(async () => {
    if (!isStreaming || wsConnectedRef.current) return;

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
      // Try to connect WebSocket for stats
      if (!livestreamApi.isDetectionWebSocketConnected()) {
        livestreamApi.connectDetectionWebSocket(handleWebSocketUpdate)
          .then(() => {
            wsConnectedRef.current = true;
            console.log('WebSocket connected for stats');
          })
          .catch((error) => {
            console.warn('WebSocket connection failed, using HTTP fallback:', error);
            wsConnectedRef.current = false;
            // Fall back to HTTP polling
            fetchStatsHttp();
            httpPollIntervalRef.current = setInterval(fetchStatsHttp, pollingInterval);
          });
      } else {
        // WebSocket already connected
        wsConnectedRef.current = true;
        wsUnsubscribeRef.current = livestreamApi.onDetectionUpdate(handleWebSocketUpdate);
      }

      // Initial fetch
      if (!livestreamApi.isDetectionWebSocketConnected()) {
        fetchStatsHttp();
      }
    } else {
      // Stop everything when not streaming
      setCounts({
        car: counts.car,
        truck: counts.truck,
        bicycle: counts.bicycle,
        motorcycle: counts.motorcycle,
        jeepney: counts.jeepney,
        tricycle: counts.tricycle
      });

      setCounts(counts);
      const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
      setTotalCount(total);

      if (httpPollIntervalRef.current) {
        clearInterval(httpPollIntervalRef.current);
        httpPollIntervalRef.current = null;
      }

      if (wsUnsubscribeRef.current) {
        wsUnsubscribeRef.current();
        wsUnsubscribeRef.current = null;
      }

      wsConnectedRef.current = false;
    }

    return () => {
      if (httpPollIntervalRef.current) {
        clearInterval(httpPollIntervalRef.current);
      }
      if (wsUnsubscribeRef.current) {
        wsUnsubscribeRef.current();
      }
    };
  }, [isStreaming, handleWebSocketUpdate, fetchStatsHttp, pollingInterval, counts]);

  return {
    counts,
    totalCount
  };
}