// services/pdf-payload-service.ts
import { ChartCaptureService } from './chart-capture-service';
import type { PDFRequestPayload } from '@/types/download_file.types';
import type {  PredictionSummary, PredictionData } from '@/types/prediction.types';
import type { trafficRecommendationDict } from '@/types/ai_recommendation.types';

export class PDFPayloadService {
    private chartCaptureService: ChartCaptureService;

    constructor() {
        this.chartCaptureService = new ChartCaptureService();
    }

    async buildPDFPayload(
        summary: PredictionSummary,
        recommendations: trafficRecommendationDict,
        predictionData: PredictionData
    ): Promise<PDFRequestPayload> {
        // Capture all chart images
        const charts = await this.chartCaptureService.captureAllCharts(predictionData);

        return {
            recommendations,
            charts,
            summary
        };
    }
}