// src/hooks/useLivestream.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { livestreamApi } from '../api/livestream_api';
import type { DetectionMode, DetectionData } from '@/models/livestream.types';

export function useLivestream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [detectionMode, setDetectionMode] = useState<DetectionMode>('raw');
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [detectionData, setDetectionData] = useState<DetectionData>({ objects: [] });

  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetectionData = useCallback(async () => {
    if (!isStreaming || detectionMode !== 'raw') return;

    try {
      const data = await livestreamApi.getDetectionData();
      setDetectionData(data);
    } catch (error) {
      console.debug('Detection data fetch skipped', error);
    }
  }, [isStreaming, detectionMode]);

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
      } else {
        toast.error(response.message || 'Failed to start livestream');
      }
    } catch (error) {
      console.error('Start error:', error);
      toast.error('Connection error. Check if backend is running.');
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, isStreaming, selectedSource]);

  const stopLivestream = useCallback(async () => {
    if (isStopping || !isStreaming) return;

    setIsStopping(true);
    try {
      const response = await livestreamApi.stopLivestream();

      if (response.success) {
        setIsStreaming(false);
        setDetectionData({ objects: [] });
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

  const testConnection = useCallback(async () => {
    try {
      // If no source is selected (auto-detect mode)
      if (!selectedSource || selectedSource === 'auto') {
        // Test all available sources
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
        // Specific source selected
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

  // Detection data polling (only in raw mode)
  useEffect(() => {
    if (isStreaming && detectionMode === 'raw') {
      fetchDetectionData();
      detectionIntervalRef.current = setInterval(fetchDetectionData, 500);
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isStreaming, detectionMode, fetchDetectionData]);

  // Status checking
  useEffect(() => {
    checkStatus();
    statusIntervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
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
    startLivestream,
    stopLivestream,
    switchMode,
    testConnection,
    setSelectedSource
  };
}