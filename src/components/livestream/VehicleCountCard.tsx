import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface VehicleCountCardProps {
  icon?: LucideIcon;
  iconUrl?: string;
  label: string;
  count: number;
  variant?: 'default' | 'total';
}

export function VehicleCountCard({
  icon: IconComponent,
  iconUrl,
  label,
  count,
  variant = 'default'
}: VehicleCountCardProps) {
  const isTotal = variant === 'total';
  const iconColorClass = isTotal ? 'text-cyan-400' : 'text-cyan-400';

  return (
    <Card
      className={`p-[6.5px] transition-all ${isTotal
        ? 'bg-cyan-500/20 border-cyan-500/50'
        : 'bg-slate-700/50 border-slate-600/50'
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* SVG from URL */}
          {iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className={`w-5 h-5 ${iconColorClass}`}
            />
          )}
          {/* Lucide Icon */}
          {IconComponent && !iconUrl && (
            <IconComponent className={`w-6 h-6 ${iconColorClass}`} />
          )}
          <span className={`text-s ${isTotal ? 'font-semibold' : ''}`}>
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