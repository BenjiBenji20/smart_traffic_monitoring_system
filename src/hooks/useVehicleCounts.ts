import { useState, useEffect, useRef, useCallback } from 'react';
import { livestreamApi, type DetectionUpdateMessage } from '@/api/livestream_api';
import type { VehicleCounts } from '@/types/livestream.types';

interface UseVehicleCountsProps {
  isStreaming: boolean;
}

export function useVehicleCounts({ isStreaming }: UseVehicleCountsProps) {
  const [counts, setCounts] = useState<VehicleCounts>({
    pedestrian: 0,
    car: 0,
    truck: 0,
    bicycle: 0,
    motorcycle: 0,
    jeepney: 0,
    tricycle: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  
  const wsUnsubscribeRef = useRef<(() => void) | null>(null);
  const wsConnectedRef = useRef(false);
  const lastKnownCountsRef = useRef<VehicleCounts | null>(null);
  const lastKnownTotalRef = useRef<number>(0);

  // Handle WebSocket updates for stats
  const handleWebSocketUpdate = useCallback((message: DetectionUpdateMessage) => {
    try {
      const newCounts = message.data.stats.vehicle_counts as unknown as VehicleCounts;
      const newTotal = message.data.stats.total_count;
      
      setCounts(newCounts);
      setTotalCount(newTotal);
      
      // Persist to ref
      lastKnownCountsRef.current = newCounts;
      lastKnownTotalRef.current = newTotal;
    } catch (error) {
      console.error('Error processing WebSocket stats:', error);
    }
  }, []);

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
            console.error('WebSocket connection failed:', error);
            wsConnectedRef.current = false;
          });
      } else {
        // WebSocket already connected
        wsConnectedRef.current = true;
        wsUnsubscribeRef.current = livestreamApi.onDetectionUpdate(handleWebSocketUpdate);
      }
    } else {
      // Restore last known counts when streaming stops
      if (lastKnownCountsRef.current) {
        setCounts(lastKnownCountsRef.current);
        setTotalCount(lastKnownTotalRef.current);
      }
      
      // Cleanup WebSocket
      if (wsUnsubscribeRef.current) {
        wsUnsubscribeRef.current();
        wsUnsubscribeRef.current = null;
      }
      wsConnectedRef.current = false;
    }

    return () => {
      if (wsUnsubscribeRef.current) {
        wsUnsubscribeRef.current();
      }
    };
  }, [isStreaming, handleWebSocketUpdate]);

  return {
    counts,
    totalCount
  };
}