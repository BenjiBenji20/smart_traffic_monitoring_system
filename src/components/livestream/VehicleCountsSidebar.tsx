import { Car, Truck, Bike, BikeIcon, AlertTriangle } from 'lucide-react';
import { VehicleCountCard } from './VehicleCountCard';
import type { VehicleCounts } from '@/models/livestream.types';

interface VehicleCountsSidebarProps {
  counts: VehicleCounts;
  totalCount: number;
}

export function VehicleCountsSidebar({ counts, totalCount }: VehicleCountsSidebarProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-3">Vehicle Counts</h3>
      
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
        icon={Bike}
        label="Bicycles"
        count={counts.bicycle}
      />
      
      <VehicleCountCard
        icon={BikeIcon}
        label="Motorbikes"
        count={counts.motorbike}
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