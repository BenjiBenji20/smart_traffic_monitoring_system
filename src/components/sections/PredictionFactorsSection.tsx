import type { PredictionFactorsAnalysis, TimePeriod } from "@/types/prediction.types";
import { useEffect, useState } from "react";
import { SharedTimePeriodButtons } from "../chart/shared-time-period-btn";
import { AIRecommendation } from "../recommendation/ai_recommendation";
import { BarChart3 } from "lucide-react";
import { TrafficFactorsChart } from "../chart/FactorsChart";

interface PredictionFactorsSectionProps {
    predictionChartData: PredictionFactorsAnalysis;
    AIRecommendationData: Record<string, string> | string | null;
    isLoading?: boolean;
    requestTimestamp: number;
}

export function PredictionFactorsSection({
    predictionChartData,
    AIRecommendationData,
    isLoading,
    requestTimestamp
}: PredictionFactorsSectionProps) {
    const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>('hourly');

    // Check which periods have data in the chart
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const availablePeriods: TimePeriod[] = predictionChartData
        ? (['hourly', 'daily', 'weekly', 'monthly'] as TimePeriod[]).filter(
            period => predictionChartData[period] && predictionChartData[period]!.length > 0
        )
        : [];

    // Set first available period as default
    useEffect(() => {
        if (availablePeriods.length > 0 && !availablePeriods.includes(currentPeriod)) {
            setCurrentPeriod(availablePeriods[0]);
        }
    }, [availablePeriods, currentPeriod]);

    // Check if AIRecommendationData has multiple periods (is an object with period keys)
    const hasMultiplePeriods = typeof AIRecommendationData === 'object' && AIRecommendationData !== null;

    return (
        <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 border">
                {/* Shared Time Period Buttons - Only show if recommendation has multiple periods */}
                {hasMultiplePeriods && availablePeriods.length > 0 && (
                    <div className="pb-3 mb-1">
                        <div className="flex items-center justify-between">
                            <div></div>
                            <SharedTimePeriodButtons
                                currentPeriod={currentPeriod}
                                availablePeriods={availablePeriods}
                                onPeriodChange={setCurrentPeriod}
                            />
                        </div>
                    </div>
                )}

                {/* Prediction Chart - Hide internal buttons, controlled by shared state */}
                <div className="pb-4 border-b">
                    <TrafficFactorsChart
                        data={predictionChartData}
                        title="Traffic Predictions and Factors"
                        height={300}
                        currentPeriod={currentPeriod}
                        onPeriodChange={setCurrentPeriod}
                        showPeriodButtons={!hasMultiplePeriods} 
                    />
                </div>

                {/* AI Recommendation - Responds to period change only if it has multiple periods */}
                <div className="pt-4">
                    <AIRecommendation
                        data={AIRecommendationData}
                        currentPeriod={currentPeriod} 
                        title="Traffic Factors Analysis Insight"
                        icon={<BarChart3 className="h-6 w-6" />}
                        persistAnimation={false}
                        loading={isLoading}
                        key={requestTimestamp}
                        maxChars={800}
                        typewriterSpeed={8}
                        maxHeight={180}
                        className="h-full text-sm"
                    />
                </div>
            </div>
        </div>
    );
}