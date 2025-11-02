import { Car, Truck, Bike, BikeIcon, AlertTriangle, PersonStanding } from 'lucide-react';
import { VehicleCountCard } from './VehicleCountCard';
import type { VehicleCounts } from '@/types/livestream.types';

interface VehicleCountsSidebarProps {
  counts: VehicleCounts;
  totalCount: number;
}

export function VehicleCountsSidebar({ counts, totalCount }: VehicleCountsSidebarProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-3">Vehicle Counts</h3>

      <VehicleCountCard
        icon={PersonStanding}
        label="Pedestrian"
        count={counts.pedestrian}
      />

      <VehicleCountCard
        iconUrl={"/jeepney.png"}
        label="Jeepneys"
        count={counts.jeepney}
      />

      <VehicleCountCard
        iconUrl={"/tricycle.png"}
        label="Tricycles"
        count={counts.tricycle}
      />

      <VehicleCountCard
        icon={Car}
        label="Cars"
        count={counts.car}
      />

      <VehicleCountCard
        icon={Truck}
        label="Trucks"
        count={counts.truck}
      />

      <VehicleCountCard
        icon={BikeIcon}
        label="Motorbikes"
        count={counts.motorcycle}
      />

      <VehicleCountCard
        icon={Bike}
        label="Bicycles"
        count={counts.bicycle}
      />

      <VehicleCountCard
        icon={AlertTriangle}
        label="Total"
        count={totalCount}
        variant="total"
      />
    </div>
  );
}