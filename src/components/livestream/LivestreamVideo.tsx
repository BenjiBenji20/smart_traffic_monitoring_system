import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useDetectionOverlay } from '@/hooks/useDetectionOverlay';
import { livestreamApi } from '@/api/livestream_api';
import type { DetectionMode, DetectionData } from '@/types/livestream.types';

interface LivestreamVideoProps {
  isStreaming: boolean;
  detectionMode: DetectionMode;
  detectionData: DetectionData;
  location?: string; // Add location prop
}

export function LivestreamVideo({
  isStreaming,
  detectionMode,
  detectionData,
  location
}: LivestreamVideoProps) {
  const videoRef = useRef<HTMLImageElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const streamUrlRef = useRef<string>('');
  const [dateTime, setDateTime] = useState('');

  const { drawDetections, clearCanvas, calculateScaleFactors } = useDetectionOverlay({
    videoRef,
    canvasRef,
    isActive: isStreaming && detectionMode === 'raw'
  });

  // Update datetime
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setDateTime(formatted);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update video source when streaming state or mode changes
  useEffect(() => {
    if (!videoRef.current) return;
    if (isStreaming) {
      const videoUrl = livestreamApi.getVideoFeedUrl(detectionMode);
      if (streamUrlRef.current !== videoUrl) {
        streamUrlRef.current = videoUrl;
        videoRef.current.src = videoUrl;
      }
    } else {
      streamUrlRef.current = '';
      videoRef.current.src = 'https://via.placeholder.com/640x360/1e293b/64748b?text=Stream+Stopped';
    }
  }, [isStreaming, detectionMode]);

  // Draw detections when data updates (raw mode only)
  useEffect(() => {
    if (isStreaming && detectionMode === 'raw' && detectionData.objects?.length > 0) {
      drawDetections(detectionData.objects);
    } else if (detectionMode === 'processed') {
      clearCanvas();
    }
  }, [isStreaming, detectionMode, detectionData, drawDetections, clearCanvas]);

  // Clear canvas when stopping
  useEffect(() => {
    if (!isStreaming) {
      clearCanvas();
    }
  }, [isStreaming, clearCanvas]);

  return (
    <Card className="relative overflow-hidden bg-slate-900/50 border-slate-700 w-fit p-0">
      {/* Header overlay with datetime */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-3">
        <div className="flex justify-between items-start text-xs">
          <div className="text-white">
            <p className="font-medium">Live Traffic Feed</p>
            {location && <p className="text-gray-400 mt-0.5">{location}</p>}
          </div>
          <div className="text-right text-white">
            <p className="font-medium">{dateTime}</p>
          </div>
        </div>
      </div>

      {/* Video container - Fixed size */}
      <div
        className="relative bg-slate-950"
        style={{
          width: '640px',
          height: '360px'
        }}
      >
        <img
          ref={videoRef}
          alt=""
          className="absolute top-0 left-0 w-full h-full object-contain"
          onLoad={() => {
            calculateScaleFactors();
          }}
          onError={(e) => {
            console.error('Video feed error - this is expected for MJPEG streams in some browsers', e);
          }}
        />

        {/* Canvas overlay for bounding boxes (raw mode only) */}
        {detectionMode === 'raw' && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ display: isStreaming ? 'block' : 'none' }}
          />
        )}

        {/* Status indicator */}
        {isStreaming && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">LIVE</span>
          </div>
        )}

        {/* Mode indicator */}
        {isStreaming && (
          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-full">
            <span className="text-white text-xs font-medium">
              {detectionMode === 'raw' ? 'RAW' : 'AI'}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}