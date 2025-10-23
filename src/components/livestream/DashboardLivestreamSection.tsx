import { useEffect, useState } from 'react';
import { LivestreamVideo } from '@/components/livestream/LivestreamVideo';
import { LivestreamControls } from '@/components/livestream/LivestreamControls';
import { VehicleCountsSidebar } from '@/components/livestream/VehicleCountsSidebar';
import { useLivestream } from '@/hooks/useLivestream';
import { useVehicleCounts } from '@/hooks/useVehicleCounts';

export function DashboardLivestreamSection() {
  const [dateTime, setDateTime] = useState('');

  const {
    isStreaming,
    detectionMode,
    availableSources,
    selectedSource,
    detectionData,
    isStarting,
    isStopping,
    selectedTracker,
    startLivestream,
    stopLivestream,
    switchMode,
    testConnection,
    setSelectedSource,
    changeTrackerAngle  
  } = useLivestream();

  const { counts, totalCount } = useVehicleCounts({
    isStreaming,
  });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 max-w-[52rem]">
        <h2 className="text-2xl font-bold">Live Malabon Barangay Longos C-4 Road</h2>
        <div className="text-right text-sm">
          <p className="text-muted-foreground text-xs">{dateTime}</p>
        </div>
      </div>

      {/* Main Content - Sidebar LEFT, Video RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-[170px_1fr] gap-6">
        {/* Vehicle Counts Sidebar - LEFT SIDE (1 column) */}
        <div>
          <VehicleCountsSidebar counts={counts} totalCount={totalCount} />
        </div>

        {/* Video Feed - RIGHT SIDE (3 columns) */}
        <div className="space-y-4">
          <LivestreamVideo
            isStreaming={isStreaming}
            detectionMode={detectionMode}
            detectionData={detectionData}
          />

          <LivestreamControls
            isStreaming={isStreaming}
            detectionMode={detectionMode}
            availableSources={availableSources}
            selectedSource={selectedSource}
            isStarting={isStarting}
            isStopping={isStopping}
            selectedTracker={selectedTracker}
            onStart={startLivestream}
            onStop={stopLivestream}
            onModeSwitch={switchMode}
            onSourceSelect={setSelectedSource}
            onTestConnection={() => testConnection()}
            onTrackerChange={changeTrackerAngle}
          />
        </div>
      </div>
    </div>
  );
}