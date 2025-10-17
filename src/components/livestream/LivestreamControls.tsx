// src/components/livestream/LivestreamControls.tsx
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Square, Wifi, Eye, Bot, Loader2 } from 'lucide-react';
import type { DetectionMode } from '@/types/livestream.types';

interface LivestreamControlsProps {
  isStreaming: boolean;
  detectionMode: DetectionMode;
  availableSources: string[];
  selectedSource: string | null;
  isStarting: boolean;
  isStopping: boolean;
  selectedTracker: string;
  onStart: () => void;
  onStop: () => void;
  onModeSwitch: (mode: DetectionMode) => void;
  onSourceSelect: (source: string | null) => void;
  onTestConnection: () => void;
  onTrackerChange: (degreeAngle: number, side: string) => void;
}

export function LivestreamControls({
  isStreaming,
  detectionMode,
  availableSources,
  selectedSource,
  isStarting,
  isStopping,
  selectedTracker,
  onStart,
  onStop,
  onModeSwitch,
  onSourceSelect,
  onTestConnection,
  onTrackerChange
}: LivestreamControlsProps) {
  // Parse tracker selection value
  const handleTrackerChange = (value: string) => {
    if (value === "default") {
      // Default tracker - reset to horizontal
      onTrackerChange(999, "default");
      return;
    }

    // Parse "30 right" or "45 left" format
    const [angleStr, side] = value.split(' ');
    const angle = parseInt(angleStr);
    onTrackerChange(angle, side);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 w-fit">
      {/* Left: Source selection */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedSource || 'auto'}
          onValueChange={(val: string | null) => onSourceSelect(val === 'auto' ? null : val)}
          disabled={isStreaming}
        >
          <SelectTrigger className="w-[115px] h-8 text-xs bg-slate-700/50 border-slate-600">
            <SelectValue placeholder="Auto-detect" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect Pi</SelectItem>
            {availableSources.map((source, idx) => (
              <SelectItem key={source} value={source}>
                Camera {idx + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          onClick={onTestConnection}
          disabled={isStreaming}
          className="h-8 px-2 text-xs"
        >
          <Wifi className="w-3 h-3 mr-1" />
          Test
        </Button>
      </div>

      {/* Tracker selection */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedTracker} 
          onValueChange={handleTrackerChange}
          disabled={!isStreaming}
        >
          <SelectTrigger className="w-[115px] h-8 text-xs bg-slate-700/50 border-slate-600">
            <SelectValue placeholder="Default Tracker" />Horizontal
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Horizontal</SelectItem>
            <SelectItem value="30 right">30° - Right</SelectItem>
            <SelectItem value="35 right">35° - Right</SelectItem>
            <SelectItem value="45 right">45° - Right</SelectItem>
            <SelectItem value="60 right">60° - Right</SelectItem>
            <SelectItem value="90 right">90° - Vertical</SelectItem>
            <SelectItem value="30 left">30° - Left</SelectItem>
            <SelectItem value="35 left">35° - Left</SelectItem>
            <SelectItem value="45 left">45° - Left</SelectItem>
            <SelectItem value="60 left">60° - Left</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Center: Mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={detectionMode === 'raw' ? 'default' : 'outline'}
          onClick={() => onModeSwitch('raw')}
          disabled={!isStreaming}
          className="h-8 text-xs"
        >
          <Eye className="w-3 h-3 mr-1" />
          Raw
        </Button>

        <Button
          size="sm"
          variant={detectionMode === 'processed' ? 'default' : 'outline'}
          onClick={() => onModeSwitch('processed')}
          disabled={!isStreaming}
          className="h-8 text-xs"
        >
          <Bot className="w-3 h-3 mr-1" />
          AI
        </Button>
      </div>

      {/* Right: Start/Stop controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onStart}
          disabled={isStreaming || isStarting}
          className="h-8 text-xs bg-green-600 hover:bg-green-700"
        >
          {isStarting ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Play className="w-3 h-3 mr-1" />
          )}
          Start
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={onStop}
          disabled={!isStreaming || isStopping}
          className="h-8 text-xs"
        >
          {isStopping ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Square className="w-3 h-3 mr-1" />
          )}
          Stop
        </Button>
      </div>
    </div>
  );
}