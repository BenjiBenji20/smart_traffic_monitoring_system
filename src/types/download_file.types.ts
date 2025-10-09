import type { trafficRecommendationDict } from "@/types/ai_recommendation.types";
import type { ChartType, PredictionData, PredictionSummary, TimePeriod } from "@/types/prediction.types";

// for JSON and XLSX file format
export interface FileDownloadPayload {
    prediction_summary: PredictionSummary;
    prediction_detail: PredictionData;
    recommendation: trafficRecommendationDict
}


// PDF file format
export interface PDFRequestPayload {
    recommendations: trafficRecommendationDict;
    charts: { [key: string]: string };           // Base64 chart images
    summary: PredictionSummary;
}


// Chart capture configuration
export interface ChartCaptureConfig {
    period: TimePeriod;
    chartType: ChartType;
    data: PredictionData;
    title?: string;
    width?: number;
    height?: number;
}


// Chart image service interface
export interface ChartImageService {
    captureChart(config: ChartCaptureConfig): Promise<string>;
    captureMultipleCharts(configs: ChartCaptureConfig[]): Promise<Record<string, string>>;
}
