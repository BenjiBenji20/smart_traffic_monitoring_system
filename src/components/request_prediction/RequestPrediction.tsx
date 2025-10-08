import type { RequestPredictionResponse } from "@/types/prediction.types";
import { PredictionChart } from "../chart/PredictionChart";
import { AIRecommendation } from "../recommendation/ai_recommendation";
import { PredictionRequestForm } from "../ui/prediction-request-form";
import { Bot } from "lucide-react";

interface RequestPredictionProps {
    requestPredictionData: RequestPredictionResponse | null;
    requestRecommendationData: Record<string, string> | string | null;
    isPredictionLoading: boolean;
    requestTimestamp: number;
    handlePredictionRequest: (endDate: string) => void;
}

export function RequestPrediction({
    requestPredictionData,
    requestRecommendationData,
    isPredictionLoading,
    requestTimestamp,
    handlePredictionRequest,
}: RequestPredictionProps) {
    return (
        <div className="w-full space-y-2"> 
            {/* Chart */}
            <div>
                <PredictionChart
                    data={requestPredictionData?.forecast || null}
                    title="Traffic Predictions"
                    height={200}
                    width="100%"
                />
            </div>

            {/* AI Recommendations */}
            <div>
                <AIRecommendation
                    data={requestRecommendationData}
                    title="AI Prediction Insights"
                    icon={<Bot className="h-3 w-3" />}
                    persistAnimation={false}
                    loading={isPredictionLoading}
                    key={requestTimestamp}
                    maxChars={500} 
                    typewriterSpeed={5}
                    maxHeight={80} 
                    className="h-full"
                />
            </div>

            {/* Form */}
            <div>
                <PredictionRequestForm
                    onRequestPrediction={handlePredictionRequest}
                    isLoading={isPredictionLoading}
                />
            </div>
        </div>
    );
}