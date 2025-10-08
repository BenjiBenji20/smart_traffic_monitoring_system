'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PredictionData, TimePeriod, ChartType } from '@/types/prediction.types';
import { LineChart, BarChart, TrendingUp } from 'lucide-react';
import { ChartRenderer } from '../chart/ChartRenderer';

interface PredictionChartProps {
    data: PredictionData | null;
    title?: string;
    height?: number;
    width?: string | number;
    fontSize?: number;
}

export function PredictionChart({
    data,
    title = "Traffic Predictions",
    height = 320,
    width = "100%",
    fontSize = 12
}: PredictionChartProps) {
    const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>('hourly');
    const [chartType, setChartType] = useState<ChartType>('line');

    // Check which periods have data
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const availablePeriods: TimePeriod[] = data
        ? (['hourly', 'daily', 'weekly', 'monthly'] as TimePeriod[]).filter(
            period => data[period] && data[period]!.length > 0
        )
        : [];

    // Set first available period as default
    useEffect(() => {
        if (availablePeriods.length > 0 && !availablePeriods.includes(currentPeriod)) {
            setCurrentPeriod(availablePeriods[0]);
        }
    }, [availablePeriods, currentPeriod]);

    // Format labels based on period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatLabel = (item: any, period: TimePeriod) => {
        try {
            switch (period) {
                case 'hourly':
                    {
                        const hourlyDate = new Date(item.time);
                        return isNaN(hourlyDate.getTime()) ? item.time : `${hourlyDate.getHours().toString().padStart(2, '0')}:00`;
                    }
                case 'daily':
                    {
                        const dailyDate = new Date(item.date);
                        return isNaN(dailyDate.getTime()) ? item.date : dailyDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                case 'weekly':
                    {
                        const weekDate = new Date(item.week_start);
                        return isNaN(weekDate.getTime()) ? item.week_start : `Week ${getWeekNumber(weekDate)}`;
                    }
                case 'monthly':
                    {
                        const monthDate = new Date(item.month_start);
                        return isNaN(monthDate.getTime()) ? item.month_start : monthDate.toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                        });
                    }
                default:
                    return 'Unknown';
            }
        } catch (error) {
            console.error('Error formatting label:', error, item);
            return 'Invalid Date';
        }
    };

    // Get chart data for current period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartData = data && data[currentPeriod]?.map((item: any) => {
        const label = formatLabel(item, currentPeriod);
        return {
            label: label,
            value: item.value,
            raw: item
        };
    }) || [];

    // Check if we have any data at all
    const hasAnyData = data && availablePeriods.length > 0;

    return (
        <Card className="w-full px-2" style={{ width: typeof width === 'number' ? `${width}px` : width }}>
            <CardHeader className="pb-2 px-3"> 
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg">{title}</CardTitle>

                    <div className="flex gap-1">
                        <Button
                            variant={chartType === 'line' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartType('line')}
                            className="h-6 px-2"
                            disabled={!hasAnyData}
                        >
                            <LineChart className="h-3 w-3 mr-1" />
                            Line
                        </Button>
                        <Button
                            variant={chartType === 'bar' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartType('bar')}
                            className="h-6 px-2"
                            disabled={!hasAnyData}
                        >
                            <BarChart className="h-3 w-3 mr-1" />
                            Bar
                        </Button>
                    </div>
                </div>

                {/* Time Period Tabs - Always visible */}
                <div className="flex gap-3 overflow-x-auto pt-1">
                    <div className="flex gap-1">
                        {(['hourly', 'daily', 'weekly', 'monthly'] as TimePeriod[]).map((period) => {
                            const hasData = availablePeriods.includes(period);
                            return (
                                <Button
                                    key={period}
                                    variant={currentPeriod === period ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => hasData && setCurrentPeriod(period)}
                                    disabled={!hasData}
                                    className={`capitalize text-xs px-2 py-1 h-6 ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {period}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-0 py-0">
                {/* Chart Container - Always rendered */}
                <div style={{ width: '100%', height: `${height}px`, minHeight: '100px' }}>
                    {hasAnyData && chartData.length > 0 ? (
                        <ChartRenderer
                            data={chartData}
                            chartType={chartType}
                            period={currentPeriod}
                            fontSize={fontSize}
                        />
                    ) : (
                        // Empty state placeholder
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-1 py-6">
                            <TrendingUp className="h-6 w-6 mb-1 opacity-20" />
                            <p className="text-xs font-medium mb-0.5">Predicted Traffic Volume</p>
                            <p className="text-[10px]">Request a prediction</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}