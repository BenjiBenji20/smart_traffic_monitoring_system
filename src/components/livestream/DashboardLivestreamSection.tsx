import { LivestreamVideo } from '@/components/livestream/LivestreamVideo';
import { LivestreamControls } from '@/components/livestream/LivestreamControls';
import { VehicleCountsSidebar } from '@/components/livestream/VehicleCountsSidebar';
import { useLivestream } from '@/hooks/useLivestream';
import { useVehicleCounts } from '@/hooks/useVehicleCounts';

export function DashboardLivestreamSection() {

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 max-w-[52rem]">
        <h2 className="text-2xl font-bold">Live at Longos, C-4 Road, Malabon City</h2>
        <div className="text-right text-sm">
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