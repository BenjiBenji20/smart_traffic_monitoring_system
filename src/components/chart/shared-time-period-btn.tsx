import { Button } from '@/components/ui/button';
import type { TimePeriod } from '@/types/prediction.types';

interface SharedTimePeriodButtonsProps {
    currentPeriod: TimePeriod;
    availablePeriods: TimePeriod[];
    onPeriodChange: (period: TimePeriod) => void;
    className?: string;
}

export function SharedTimePeriodButtons({
    currentPeriod,
    availablePeriods,
    onPeriodChange,
    className = ''
}: SharedTimePeriodButtonsProps) {
    return (
        <div className={`flex gap-2 ${className}`}>
            {(['hourly', 'daily', 'weekly', 'monthly'] as TimePeriod[]).map((period) => {
                const hasData = availablePeriods.includes(period);
                return (
                    <Button
                        key={period}
                        variant={currentPeriod === period ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => hasData && onPeriodChange(period)}
                        disabled={!hasData}
                        className={`capitalize text-xs px-3 py-2 h-7 ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {period}
                    </Button>
                );
            })}
        </div>
    );
}