import type { trafficRecommendationDict } from "@/types/ai_recommendation.types";
import type { PredictionData, PredictionSummary } from "@/types/prediction.types";

export interface FileDownloadPayload {
    prediction_summary: PredictionSummary;
    prediction_detail: PredictionData;
    recommendation: trafficRecommendationDict
}
