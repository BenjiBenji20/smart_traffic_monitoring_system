import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface VehicleCountCardProps {
  icon: LucideIcon;
  label: string;
  count: number;
  variant?: 'default' | 'total';
}

export function VehicleCountCard({
  icon: Icon,
  label,
  count,
  variant = 'default'
}: VehicleCountCardProps) {
  const isTotal = variant === 'total';

  return (
    <Card
      className={`p-3 transition-all ${isTotal
        ? 'bg-cyan-500/20 border-cyan-500/50'
        : 'bg-slate-700/50 border-slate-600/50'
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            className={`w-6 h-6 ${isTotal ? 'text-cyan-400' : 'text-cyan-400'}`}
          />
          <span className={`text-xs ${isTotal ? 'font-semibold' : ''}`}>
            {label}
          </span>
        </div>
        <span className={`text-xl font-bold ${isTotal ? 'text-cyan-400' : ''}`}>
          {count}
        </span>
      </div>
    </Card>
  );
}