// components/HiddenChartRenderer.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { PredictionChart } from './PredictionChart';
import type { PredictionData, TimePeriod } from '@/types/prediction.types';

interface HiddenChartRendererProps {
    data: PredictionData;
    onChartsReady?: (chartRefs: Map<TimePeriod, HTMLDivElement>) => void;
}

export function HiddenChartRenderer({ data, onChartsReady }: HiddenChartRendererProps) {
    const chartRefs = useRef<Map<TimePeriod, HTMLDivElement>>(new Map());
    const [renderCount, setRenderCount] = useState(0);

    const periods = ['hourly', 'daily', 'weekly', 'monthly'] as const;

    // Force re-render when data changes
    useEffect(() => {
        setRenderCount(prev => prev + 1);
    }, [data]);

    // Notify when charts are ready (with delay to ensure rendering)
    useEffect(() => {
        if (chartRefs.current.size > 0 && onChartsReady) {
            const timer = setTimeout(() => {
                onChartsReady(chartRefs.current);
            }, 500); // Give charts time to render

            return () => clearTimeout(timer);
        }
    }, [renderCount, onChartsReady]);

    const setRef = (period: TimePeriod) => (el: HTMLDivElement | null) => {
        if (el) {
            chartRefs.current.set(period, el);
        } else {
            chartRefs.current.delete(period);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                left: '-9999px',
                top: '-9999px',
                opacity: 1, // Keep opacity 1 for capture
                pointerEvents: 'none',
                zIndex: -9999
            }}
            key={renderCount} // Force re-render when data changes
        >
            {periods.map((period) => (
                data[period] && data[period]!.length > 0 && (
                    <div
                        key={period}
                        ref={setRef(period)}
                        style={{
                            width: '800px',
                            height: '400px',
                            marginBottom: '20px',
                            backgroundColor: 'white', // Ensure white background
                            border: '1px solid #ccc' // Visual debug border
                        }}
                        className="hidden-chart-container"
                    >
                        <PredictionChart
                            data={{ [period]: data[period] } as PredictionData}
                            currentPeriod={period}
                            showPeriodButtons={false}
                            //   chartType="bar"
                            width={800}
                            height={400}
                            fontSize={14}
                            title={`${period.charAt(0).toUpperCase() + period.slice(1)} Predictions`}
                        />
                    </div>
                )
            ))}
        </div>
    );
}