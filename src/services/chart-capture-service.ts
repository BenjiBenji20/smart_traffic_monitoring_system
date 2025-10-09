// services/chart-capture-service.ts
import html2canvas from 'html2canvas';
import type { ChartCaptureConfig } from '@/types/download_file.types';
import type { PredictionData } from '@/types/prediction.types';

export class ChartCaptureService {
    private chartContainers: Map<string, HTMLDivElement> = new Map();

    // Call this method to register chart containers from HiddenChartRenderer
    registerChartContainers(containers: Map<string, HTMLDivElement>) {
        this.chartContainers = containers;
    }

    async captureChart(config: ChartCaptureConfig): Promise<string> {
        const { period, width = 800, height = 400 } = config;

        const container = this.chartContainers.get(period);
        if (!container) {
            throw new Error(`No chart container found for period: ${period}`);
        }

        // Ensure container is visible for capture (temporarily)
        const originalStyle = container.style.cssText;
        container.style.position = 'fixed';
        container.style.left = '0';
        container.style.top = '0';
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';

        try {
            // Wait a bit for the chart to render
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(container, {
                width: width,
                height: height,
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            return canvas.toDataURL('image/png');
        } finally {
            // Restore original style
            container.style.cssText = originalStyle;
        }
    }

    async captureAllCharts(data: PredictionData): Promise<Record<string, string>> {
        const images: Record<string, string> = {};
        const periods = ['hourly', 'daily', 'weekly', 'monthly'] as const;

        for (const period of periods) {
            if (data[period] && data[period]!.length > 0 && this.chartContainers.has(period)) {
                try {
                    images[period] = await this.captureChart({
                        period,
                        data,
                        width: 800,
                        height: 400,
                        chartType: 'bar'
                    });
                } catch (error) {
                    console.error(`Failed to capture ${period} chart:`, error);
                }
            }
        }

        return images;
    }
}