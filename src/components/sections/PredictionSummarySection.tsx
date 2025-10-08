import { Bot } from "lucide-react";
import type { PredictionSummary } from "@/types/prediction.types";
import { AIRecommendation } from "../recommendation/ai_recommendation";
import { PredictionSummaryComp } from "../chart/PredictionSummary";

interface PredictionSummarySectionProps {
    summaryData: PredictionSummary;
    isLoading?: boolean;
    error?: string | null;
    AIRecommendationData: Record<string, string> | string | null;
    requestTimestamp: number;
}

export function PredictionSummarySection({
    summaryData,
    isLoading,
    error,
    AIRecommendationData,
    requestTimestamp
}: PredictionSummarySectionProps) {
    return (
        <div className="space-y-4">
            {/* Combined Section with Compact Layout */}
            <div className="bg-muted/30 rounded-lg p-4 border">
                {/* Compact Prediction Summary */}
                <div className="pb-4 border-b">
                    <PredictionSummaryComp
                        data={summaryData}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>

                {/* Compact AI Recommendation */}
                <div className="pt-4">
                    <AIRecommendation
                        data={AIRecommendationData}
                        title="AI Recommendation"
                        icon={<Bot className="h-6 w-6" />}
                        persistAnimation={false}
                        loading={isLoading}
                        key={requestTimestamp}
                        maxChars={800} // Reduced character limit
                        typewriterSpeed={8} // Faster animation
                        maxHeight={180} // Smaller max height
                        className="h-full text-sm" // Smaller text
                    />
                </div>
            </div>
        </div>
    );
}