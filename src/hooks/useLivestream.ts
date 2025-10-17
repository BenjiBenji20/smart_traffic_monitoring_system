// src/hooks/useLivestream.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { livestreamApi, type DetectionUpdateMessage } from '../api/livestream_api';
import type { DetectionMode, DetectionData } from '@/types/livestream.types';

export function useLivestream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [detectionMode, setDetectionMode] = useState<DetectionMode>('raw');
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [detectionData, setDetectionData] = useState<DetectionData>({ objects: [] });

  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<string>('0');

  const wsUnsubscribeRef = useRef<(() => void) | null>(null);

  // Handle WebSocket messages
  const handleDetectionUpdate = useCallback((message: DetectionUpdateMessage) => {
    // Update detection data
    setDetectionData({
      objects: message.data.detections
    });
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const status = await livestreamApi.getLivestreamStatus();

      const wasStreaming = isStreaming;
      setIsStreaming(status.running);
      setAvailableSources(status.available_sources || []);

      if (status.current_source) {
        setCurrentLocation(status.current_source);
      }

      if (wasStreaming !== status.running) {
        console.log(`Status synced: ${status.running ? 'streaming' : 'stopped'}`);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  }, [isStreaming]);

  const startLivestream = useCallback(async () => {
    if (isStarting || isStreaming) return;

    setIsStarting(true);
    try {
      const response = await livestreamApi.startLivestream({
        camera_source: selectedSource,
        detection_mode: 'raw'
      });

      if (response.success) {
        setIsStreaming(true);
        setDetectionMode('raw');
        setCurrentLocation(response.camera_source || 'Unknown Location');
        toast.success(`Livestream started: ${response.camera_source}`);

        // Connect WebSocket after starting stream
        try {
          await livestreamApi.connectDetectionWebSocket(handleDetectionUpdate);
          console.log('WebSocket connected');
        } catch (wsError) {
          console.warn('WebSocket connection failed, will use HTTP fallback:', wsError);
          // Fallback to HTTP polling happens automatically via useVehicleCounts
        }
      } else {
        toast.error(response.message || 'Failed to start livestream');
      }
    } catch (error) {
      console.error('Start error:', error);
      toast.error('Connection error. Check if backend is running.');
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, isStreaming, selectedSource, handleDetectionUpdate]);

  const stopLivestream = useCallback(async () => {
    if (isStopping || !isStreaming) return;

    setIsStopping(true);
    try {
      const response = await livestreamApi.stopLivestream();

      if (response.success) {
        setIsStreaming(false);
        setDetectionData({ objects: [] });

        // Disconnect WebSocket
        livestreamApi.disconnectDetectionWebSocket();

        toast.success('Livestream stopped');
      } else {
        toast.error(response.message || 'Failed to stop livestream');
      }
    } catch (error) {
      console.error('Stop error:', error);
      toast.error('Connection error while stopping');
    } finally {
      setIsStopping(false);
    }
  }, [isStopping, isStreaming]);

  const switchMode = useCallback(async (mode: DetectionMode) => {
    setDetectionMode(mode);

    if (!isStreaming) return;

    try {
      const response = await livestreamApi.switchDetectionMode(mode);

      if (response.success) {
        const message = mode === 'raw'
          ? 'Raw mode: AI disabled, no Firebase updates'
          : 'AI mode: Vehicle counting and Firebase updates enabled';
        toast.success(message);
      }
    } catch (error) {
      console.error('Mode switch error:', error);
      toast.error('Failed to switch mode');
    }
  }, [isStreaming]);

  const changeTrackerAngle = async (degreeAngle: number, side: string) => {
    try {
      if (degreeAngle === 0 || degreeAngle === 999) {
        // Reset to default horizontal line
        const response = await livestreamApi.changeLimitAngle({
          degree_angle: 999,
          side: 'default'
        });
        console.log('Tracker reset to default:', response.message);
        setSelectedTracker("default");
        return;
      }

      const response = await livestreamApi.changeLimitAngle({
        degree_angle: degreeAngle,
        side: side
      });

      console.log(`Tracker angle changed: ${degreeAngle}° ${side}`, response.limit);
      setSelectedTracker(`${degreeAngle} ${side}`);
      toast.success(`Tracker angle changed: ${degreeAngle}° ${side}`);
    } catch (error) {
      console.error('Failed to change tracker angle:', error);
      toast.error(`Tracker angle not available.\nBack to default: ${degreeAngle}° ${side}`);
    }
  };

  const testConnection = useCallback(async () => {
    try {
      if (!selectedSource || selectedSource === 'auto') {
        let foundWorking = false;

        for (let i = 0; i < availableSources.length; i++) {
          const result = await livestreamApi.testPiConnection(i);

          if (result.connected) {
            toast.success(`✓ Camera Source ${i + 1} - Connected`);
            foundWorking = true;
            break;
          }
        }

        if (!foundWorking) {
          toast.error('✗ No working camera sources found');
        }

        return foundWorking;
      } else {
        const selectedIndex = availableSources.indexOf(selectedSource);

        if (selectedIndex === -1) {
          toast.error('Invalid camera source selected');
          return false;
        }

        const result = await livestreamApi.testPiConnection(selectedIndex);

        const message = result.connected
          ? `✓ Camera Source ${selectedIndex + 1} - Connected`
          : `✗ Camera Source ${selectedIndex + 1} - Failed`;

        toast[result.connected ? 'success' : 'error'](message);

        return result.connected;
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error('Connection test failed');
      return false;
    }
  }, [selectedSource, availableSources]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsUnsubscribeRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        wsUnsubscribeRef.current();
      }
      livestreamApi.disconnectDetectionWebSocket();
    };
  }, []);

  // Status checking (keep this for overall status)
  useEffect(() => {
    checkStatus();
    const statusIntervalRef_local = setInterval(checkStatus, 5000);

    return () => {
      clearInterval(statusIntervalRef_local);
    };
  }, [checkStatus]);

  return {
    isStreaming,
    detectionMode,
    availableSources,
    selectedSource,
    currentLocation,
    detectionData,
    isStarting,
    isStopping,
    selectedTracker,
    startLivestream,
    stopLivestream,
    switchMode,
    changeTrackerAngle,
    testConnection,
    setSelectedSource
  };
}


