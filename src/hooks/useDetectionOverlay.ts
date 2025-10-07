// src/hooks/useDetectionOverlay.ts
import { useEffect, useRef, useCallback } from 'react';
import type { DetectedObject, ScaleFactors } from '@/models/livestream.types';

interface UseDetectionOverlayProps {
  videoRef: React.RefObject<HTMLImageElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
}

export function useDetectionOverlay({ videoRef, canvasRef, isActive }: UseDetectionOverlayProps) {
  const scaleFactorsRef = useRef<ScaleFactors>({ x: 1, y: 1 });
  const animationFrameRef = useRef<number | undefined>(undefined);

const calculateScaleFactors = useCallback(() => {
  if (!videoRef.current || !canvasRef.current) return;

  const displayWidth = videoRef.current.clientWidth;
  const displayHeight = videoRef.current.clientHeight;

  // Backend detection resolution (Pi camera)
  const detectionWidth = 480;
  const detectionHeight = 270;

  scaleFactorsRef.current = {
    x: displayWidth / detectionWidth,
    y: displayHeight / detectionHeight
  };
  canvasRef.current.width = displayWidth;
  canvasRef.current.height = displayHeight;

}, [videoRef, canvasRef]);

  const drawDetections = useCallback((objects: DetectedObject[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!objects || objects.length === 0) return;

    const { x: scaleX, y: scaleY } = scaleFactorsRef.current;

    // OPTIMIZED: Draw all boxes in one batch
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.font = '12px Arial';

    // Draw bounding boxes
    ctx.beginPath();
    for (const obj of objects) {
      if (!obj.bbox || obj.bbox.length !== 4) continue;

      const [x1, y1, x2, y2] = obj.bbox;
      const x = x1 * scaleX;
      const y = y1 * scaleY;
      const w = (x2 - x1) * scaleX;
      const h = (y2 - y1) * scaleY;

      ctx.rect(x, y, w, h);
    }
    ctx.stroke();

    // Draw labels
    for (const obj of objects) {
      if (!obj.bbox || obj.bbox.length !== 4) continue;

      const [x1, y1] = obj.bbox;
      const x = x1 * scaleX;
      const y = y1 * scaleY;

      const label = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
      const metrics = ctx.measureText(label);

      // Label background
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fillRect(x, y - 16, metrics.width + 8, 14);

      // Label text
      ctx.fillStyle = '#000';
      ctx.fillText(label, x + 4, y - 4);
    }
  }, [canvasRef]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef]);

  // Handle resize events
  useEffect(() => {
    if (!videoRef.current || !isActive) return;

    calculateScaleFactors();

    const resizeObserver = new ResizeObserver(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(calculateScaleFactors);
    });

    resizeObserver.observe(videoRef.current);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoRef, isActive, calculateScaleFactors]);

  return {
    drawDetections,
    clearCanvas,
    calculateScaleFactors
  };
}