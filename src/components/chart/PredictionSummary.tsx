// components/PredictionSummary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PredictionSummary } from "@/types/prediction.types";

export interface PredictionSummaryProps {
    data: PredictionSummary | null;
    isLoading?: boolean;
    error?: string | null;
}

export function PredictionSummaryComp({ data, isLoading, error }: PredictionSummaryProps) {
    // Format numbers with commas
    const formatNumber = (num: number) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Condition-based styling
    const conditionToColor = {
        congested: "text-red-500",
        moderate: "text-yellow-500",
        free: "text-green-500",
    } as const;

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Failed to load traffic data. {error || "Please try again later."}
                </AlertDescription>
            </Alert>
        );
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!data) {
        return (
            <Alert>
                <AlertDescription>No data available</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Today's Card */}
            <Card className={conditionToColor[data.today_analytics.peak.condition]}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatNumber(data.vhcl_today_sum)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Peak at{" "}
                        {new Date(data.today_analytics.peak.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </CardContent>
            </Card>

            {/* Weekly Card */}
            <Card className={conditionToColor[data.weekly_analytics.peak.condition]}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">This Week</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatNumber(data.vhcl_current_week_sum)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Peak on{" "}
                        {new Date(data.weekly_analytics.peak.date).toLocaleDateString([], {
                            weekday: "long",
                        })}
                    </p>
                </CardContent>
            </Card>

            {/* 3 Months Card */}
            <Card
                className={conditionToColor[data.three_months_analytics.peak.condition]}
            >
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">3 Months</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatNumber(data.vhcl_three_months_sum)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Avg {formatNumber(data.three_months_analytics.avg)} vehicles/month
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}