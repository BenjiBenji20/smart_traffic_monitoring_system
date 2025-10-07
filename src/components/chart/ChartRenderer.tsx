'use client';

import { LineChart, BarChart, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, Bar, Area, CartesianGrid } from 'recharts';

interface ChartData {
    label: string;
    value: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any;
}

interface ChartRendererProps {
    data: ChartData[];
    chartType: 'line' | 'bar' | 'area';
    period: string;
    fontSize: number;
}

export function ChartRenderer({ data, chartType, period, fontSize }: ChartRendererProps) {
    const chartConfig = {
        line: {
            color: '#3b82f6', // Blue
        },
        bar: {
            color: '#10b981'  // Green
        },
        area: {
            color: '#8b5cf6'  // Purple
        }
    };

    // Adjust margins based on data size
    const commonProps = {
        data,
        margin: { top: 0, right: 30, left: 30, bottom: 0 }
    };

    // Determine tick angle and interval based on data length
    const tickAngle = data.length > 12 ? -45 : 0;
    const tickInterval = data.length > 20 ? 'preserveStartEnd' : 0;

    return (
        <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
                <BarChart {...commonProps}>
                    <CartesianGrid strokeDasharray="1" stroke="#374151" />
                    <XAxis 
                        dataKey="label"
                        angle={tickAngle}
                        textAnchor={tickAngle === 0 ? 'middle' : 'end'}
                        height={70}
                        interval={tickInterval}
                        minTickGap={1}
                        tick={{ fontSize: fontSize, fill: '#374151' }}
                        stroke="#9ca3af"
                    />
                    <YAxis 
                        tick={{ fontSize: fontSize, fill: '#374151' }}
                        stroke="#9ca3af"
                        width={60}
                    />
                    <Tooltip
                        formatter={(value: number) => [`${value.toLocaleString()} vehicles`, 'Predicted']}
                        labelFormatter={(label) => `${period}: ${label}`}
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px'
                        }}
                    />
                    <Bar
                        dataKey="value"
                        fill={chartConfig.bar.color}
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            ) : chartType === 'area' ? (
                <AreaChart {...commonProps}>
                    <CartesianGrid strokeDasharray="1" stroke="#374151" />
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartConfig.area.color} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={chartConfig.area.color} stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="label"
                        angle={tickAngle}
                        textAnchor={tickAngle === 0 ? 'middle' : 'end'}
                        height={70}
                        interval={tickInterval}
                        minTickGap={1}
                        tick={{ fontSize: fontSize, fill: '#374151' }}
                        stroke="#9ca3af"
                    />
                    <YAxis 
                        tick={{ fontSize: fontSize, fill: '#374151' }}
                        stroke="#9ca3af"
                        width={60}
                    />
                    <Tooltip
                        formatter={(value: number) => [`${value.toLocaleString()} vehicles`, 'Predicted']}
                        labelFormatter={(label) => `${period}: ${label}`}
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chartConfig.area.color}
                        fill="url(#areaGradient)"
                        strokeWidth={2}
                    />
                </AreaChart>
            ) : (
                <LineChart {...commonProps}>
                    <CartesianGrid strokeDasharray="1" stroke="#374151" />
                    <XAxis 
                        dataKey="label"
                        angle={tickAngle}
                        textAnchor={tickAngle === 0 ? 'middle' : 'end'}
                        height={70}
                        interval={tickInterval}
                        minTickGap={1}
                        tick={{ fontSize: fontSize, fill: '#374151' }}
                        stroke="#9ca3af"
                    />
                    <YAxis 
                        tick={{ fontSize: fontSize, fill: '#374151' }}
                        stroke="#9ca3af"
                        width={60}
                    />
                    <Tooltip
                        formatter={(value: number) => [`${value.toLocaleString()} vehicles`, 'Predicted']}
                        labelFormatter={(label) => `${period}: ${label}`}
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={chartConfig.line.color}
                        strokeWidth={3}
                        dot={{ fill: chartConfig.line.color, r: 4 }}
                        activeDot={{ r: 6, fill: chartConfig.line.color }}
                    />
                </LineChart>
            )}
        </ResponsiveContainer>
    );
}