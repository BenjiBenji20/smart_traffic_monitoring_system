/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import type { ContributingFactor, PredictionFactorsAnalysis, TimePeriod } from '@/types/prediction.types';

interface TrafficFactorsChartProps {
    data: PredictionFactorsAnalysis | null;
    title?: string;
    height?: number;
    currentPeriod?: TimePeriod;
    onPeriodChange?: (period: TimePeriod) => void;
    showPeriodButtons?: boolean;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const factors = data.contributing_factors || [];

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm">
            <p className="font-semibold text-sm mb-2 text-gray-900">{label}</p>

            <div className="space-y-1 mb-2">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium" style={{ color: entry.color }}>
                            {entry.name}:
                        </span>
                        <span className="text-xs font-bold text-gray-900">
                            {entry.value.toFixed(1)} vehicles
                        </span>
                    </div>
                ))}
            </div>

            {factors.length > 0 && (
                <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <p className="text-xs font-semibold text-gray-700 mb-1.5">Contributing Factors:</p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {factors.map((factor: ContributingFactor, idx: number) => (
                            <div key={idx} className="text-xs">
                                <div className="flex items-start gap-1">
                                    <span className="text-gray-500 mt-0.5">•</span>
                                    <div className="flex-1">
                                        <span className="font-medium text-gray-900">{factor.factor}</span>
                                        <span className={`ml-1.5 font-semibold ${factor.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}
                                        </span>
                                        <p className="text-gray-600 mt-0.5 leading-tight">{factor.reason}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export function TrafficFactorsChart({
    data,
    title = "Traffic Factors Analysis",
    height = 320,
    currentPeriod: externalPeriod,
    onPeriodChange,
    showPeriodButtons = true
}: TrafficFactorsChartProps) {
    const [internalPeriod, setInternalPeriod] = useState<TimePeriod>('hourly');

    const currentPeriod = externalPeriod !== undefined ? externalPeriod : internalPeriod;

    const availablePeriods: TimePeriod[] = data
        ? (['hourly', 'daily', 'weekly', 'monthly'] as TimePeriod[]).filter(
            period => data[period] && data[period]!.length > 0
        )
        : [];

    useEffect(() => {
        if (availablePeriods.length > 0 && !availablePeriods.includes(currentPeriod)) {
            const firstPeriod = availablePeriods[0];
            if (onPeriodChange) {
                onPeriodChange(firstPeriod);
            } else {
                setInternalPeriod(firstPeriod);
            }
        }
    }, [availablePeriods, currentPeriod, onPeriodChange]);

    const handlePeriodChange = (period: TimePeriod) => {
        if (onPeriodChange) {
            onPeriodChange(period);
        } else {
            setInternalPeriod(period);
        }
    };

    const formatLabel = (item: any, period: TimePeriod) => {
        try {
            switch (period) {
                case 'hourly': {
                    const date = new Date(item.time);
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                }
                case 'daily': {
                    const date = new Date(item.date);
                    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                }
                case 'weekly': {
                    const date = new Date(item.week_start);
                    return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }
                case 'monthly': {
                    const date = new Date(item.month);
                    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                }
                default:
                    return 'Unknown';
            }
        } catch {
            return 'Invalid Date';
        }
    };

    const chartData = data && data[currentPeriod]?.map((item: any) => {
        try {
            return {
                name: formatLabel(item, currentPeriod), // IMPORTANT: Add 'name' field for XAxis
                label: formatLabel(item, currentPeriod),
                base_traffic: Number(item.base_traffic) || 0,
                final_prediction: Number(item.final_prediction) || 0,
                contributing_factors: item.contributing_factors || [],
                net_impact: Number(item.net_impact) || 0
            };
        } catch (error) {
            console.error('Error mapping chart data:', error, item);
            return null;
        }
    }).filter(Boolean) || [];

    const hasAnyData = data && availablePeriods.length > 0 && chartData.length > 0;

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {title}
                    </CardTitle>
                </div>

                {showPeriodButtons && (
                    <div className="flex gap-1 pt-2">
                        {(['hourly', 'daily', 'weekly', 'monthly'] as TimePeriod[]).map((period) => {
                            const hasData = availablePeriods.includes(period);
                            return (
                                <Button
                                    key={period}
                                    variant={currentPeriod === period ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => hasData && handlePeriodChange(period)}
                                    disabled={!hasData}
                                    className={`capitalize text-xs px-3 py-1 h-7 ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {period}
                                </Button>
                            );
                        })}
                    </div>
                )}
            </CardHeader>

            <CardContent>
                <div style={{ width: '100%', height: hasAnyData ? `${height}px` : '200px' }}>
                    {hasAnyData && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart 
                                data={chartData} 
                                margin={{ top: 10, right: 30, left: 20, bottom: chartData.length > 12 ? -5 : 10 }}
                            >
                                <defs>
                                    <linearGradient id="baseTrafficGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="finalPredictionGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="1" stroke="#374151" />
                                <XAxis
                                    dataKey="name" 
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    angle={chartData.length > 12 ? -45 : 0}
                                    textAnchor={chartData.length > 12 ? 'end' : 'middle'}
                                    height={chartData.length > 12 ? 80 : 50}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                    iconType="plainline"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="base_traffic"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#baseTrafficGradient)"
                                    name="Base Traffic"
                                    connectNulls={false}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="final_prediction"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#finalPredictionGradient)"
                                    name="Final Prediction"
                                    connectNulls={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium mb-1">Traffic Factors Analysis</p>
                            <p className="text-xs">No data available</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}