import { DashboardSidebar } from "../../components/sidebar/DashboardSidebar"
import { DashboardNav } from "../../components/nav/DashboardNav"
import { useCallback, useEffect, useState } from "react"
import type { UserModel } from "@/types/user_model"
import { getUserProfile } from "@/api/user_api";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/skeleton/dashboard-page-skeleton";
import { DashboardLivestreamSection } from "@/components/livestream/LivestreamContainer";
import { ErrorPage } from "../error/ErrorPage";
import { useNavigate } from "react-router";
import type {
    PredictionSummary,
    PredictionData,
    PredictionFactorsAnalysis,
    RequestPredictionResponse
} from "@/types/prediction.types";
import { predictionDetail, predictionFactorsAnalysis, predictionRequest, predictionSummary } from "@/api/prediction_api";
import { recommendationDict, recommendationFactorsAnalysis, recommendationStr } from "@/api/ai_recommendation_api";
import type {
    trafficFactorsAnalysis,
    trafficRecommendationDict,
    trafficRecommendationStr
} from "@/types/ai_recommendation.types";
import { RequestPrediction } from "@/components/request_prediction/RequestPrediction";
import { PredictionSummarySection } from "@/components/sections/PredictionSummarySection";
import { PredictionDetailSection } from "@/components/sections/PredictionDetailSection";
import { PredictionFactorsSection } from "@/components/sections/PredictionFactorsSection";
import type { FileDownloadPayload } from "@/types/download_file.types";
import { DownloadButton } from "@/components/download-button/DownloadButton";
import { ChartCaptureService } from "@/services/chart-capture-service";
import { HiddenChartRenderer } from "@/components/chart/HiddenChartRenderer";

export function DashboardPage() {
    const [userData, setUserData] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showErrorPage, setShowErrorPage] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);

    const [requestPredictionData, setRequestPredictionData] =
        useState<RequestPredictionResponse | null>(null);
    const [requestRecommendationData, setRequestRecommendationData] =
        useState<trafficRecommendationStr | null>(null);

    // Add state for prediction request loading
    const [isPredictionLoading, setIsPredictionLoading] = useState(false);
    // Add timestamp to force re-animation on new requests
    const [requestTimestamp, setRequestTimestamp] = useState(0);

    // Prediction Data
    const [predictionSummaryData, setPredictionSummaryData] = useState<PredictionSummary | null>(null);
    const [predictionDetailData, setPredictionDetailData] = useState<PredictionData | null>(null);
    const [predictionFactorsAnalysisData, setPredictionFactorsAnalysisData] =
        useState<PredictionFactorsAnalysis | null>(null);

    // Prediction AI Recommendation
    const [recommendationDetailData, setRecommendationDetailData] =
        useState<trafficRecommendationDict | null>(null);
    const [recommendationFactorsAnalysisData, setRecommendationFactorsAnalysisData] =
        useState<trafficFactorsAnalysis | null>(null);

    // Download button
    const [downloadPayload, setDownloadPayload] = useState<FileDownloadPayload | null>(null);

    const chartCaptureService = new ChartCaptureService();
    const [isChartsReady, setIsChartsReady] = useState(false);

    const handleChartsReady = useCallback((chartRefs: Map<string, HTMLDivElement>) => {
        chartCaptureService.registerChartContainers(chartRefs);
        setIsChartsReady(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const navigator = useNavigate();

    useEffect(() => {
        const fetchAllDashboardData = async () => {
            try {
                setIsLoading(true);
                setIsChartsReady(false); // Reset charts ready state

                // wait for your auth context to be ready
                await new Promise(resolve => setTimeout(resolve, 1000));

                const user = await getUserProfile();
                setUserData(user);

                const predictionSummaryRes = await predictionSummary();
                setPredictionSummaryData(predictionSummaryRes);
                // console.log("\npredictionSummaryRes", predictionSummaryRes);

                const predictionDetailRes = await predictionDetail();
                setPredictionDetailData(predictionDetailRes);
                // console.log("\npredictionDetailRes", predictionDetailRes);

                const predictionFactorsAnalysisRes = await predictionFactorsAnalysis();
                setPredictionFactorsAnalysisData(predictionFactorsAnalysisRes);
                // console.log("\npredictionFactorsAnalysisRes", predictionFactorsAnalysisRes);

                const recommendationDetailRes = await recommendationDict();
                setRecommendationDetailData(recommendationDetailRes);
                // console.log("\nrecommendationDetailRes", recommendationDetailRes);

                const recommendationFactorsAnalysisRes = await recommendationFactorsAnalysis();
                setRecommendationFactorsAnalysisData(recommendationFactorsAnalysisRes);
                // console.log("\nrecommendationFactorsAnalysisRes", recommendationFactorsAnalysisRes);

                // pass each fetched data to download payload to use in button
                setDownloadPayload({
                    prediction_summary: predictionSummaryRes,
                    prediction_detail: predictionDetailRes,
                    recommendation: recommendationDetailRes
                });

                setIsError(false);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setShowErrorPage(true);
                setIsError(true);
                toast.error("Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDashboardData();
    }, []);

    const handlePredictionRequest = async (endDate: string) => {
        try {
            setIsPredictionLoading(true); // Set prediction loading state

            // Fetch prediction data
            const predictionData = await predictionRequest({ end: endDate });
            setRequestPredictionData(predictionData);

            const recommendationData = await recommendationStr({ end: endDate });
            setRequestRecommendationData(recommendationData);

            // Update timestamp to force re-animation
            setRequestTimestamp(Date.now());

            setIsError(false);
            toast.success("Prediction generated successfully!");
        } catch (error) {
            console.error("Failed to fetch prediction request data:", error);
            setIsError(true);
            toast.error("Failed to load prediction request data");
        } finally {
            setIsPredictionLoading(false); // Reset prediction loading
        }
    };

    if (isLoading) {
        return <div><DashboardPageSkeleton /></div>;
    }

    return (
        <>
            <title>C4Vision - Dashboard</title>
            {
                !userData || isError || showErrorPage ||
                    !predictionSummaryData || !predictionDetailData || !predictionFactorsAnalysisData ||
                    !recommendationDetailData || !recommendationFactorsAnalysisData ?
                    (
                        <ErrorPage
                            title="Failed to load data"
                            message="Could not connect to the server. Please check your connection."
                            onRetry={() => window.location.reload()}
                            onGoHome={() => navigator('/')}
                        />
                    ) : (
                        <>
                            <div className="fixed top-0 left-0 right-0 z-50">
                                <DashboardNav userData={userData} />
                            </div>

                            {/* Main content with sidebar offset */}
                            <main className="ml-64 pt-16 min-h-screen">
                                <div className="flex">
                                    {/* Left side - Main content */}
                                    <div className="flex-1 p-6">
                                        <div className="space-y-6">
                                            <DashboardSidebar userData={userData} />
                                            <div id="livestream-section">
                                                <DashboardLivestreamSection />
                                            </div>

                                            {/* ALL SECTIONS */}
                                            <div className="space-y-6 max-w-[845px]">
                                                {/* Prediction Summary Section */}
                                                <div id="prediction-summary-section">
                                                    <PredictionSummarySection
                                                        summaryData={predictionSummaryData}
                                                        isLoading={false}
                                                        requestTimestamp={requestTimestamp}
                                                        AIRecommendationData={recommendationDetailData?.summary_reco}
                                                    />
                                                </div>

                                                {/* Prediction Detail Section */}
                                                <div id="prediction-detailed-section">
                                                    <PredictionDetailSection
                                                        predictionChartData={predictionDetailData}
                                                        isLoading={false}
                                                        requestTimestamp={requestTimestamp}
                                                        AIRecommendationData={recommendationDetailData as unknown as Record<string, string>}
                                                    />
                                                </div>

                                                {/* Prediction Factors Section */}
                                                <div id="prediction-factors-section">
                                                    <PredictionFactorsSection
                                                        predictionChartData={predictionFactorsAnalysisData}
                                                        isLoading={false}
                                                        requestTimestamp={requestTimestamp}
                                                        AIRecommendationData={recommendationFactorsAnalysisData as unknown as Record<string, string>}
                                                    />
                                                </div>

                                                <div id="download-reports-section">
                                                    {/* Hidden Chart Renderer for PDF */}
                                                    <HiddenChartRenderer
                                                        data={predictionDetailData}
                                                        onChartsReady={handleChartsReady}
                                                    />

                                                    {/* Download Button with Modal */}
                                                    <DownloadButton
                                                        payload={downloadPayload!}
                                                        disabled={!downloadPayload || !isChartsReady}
                                                        variant="outline"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right side - Fixed Prediction Panel */}
                                    <div className="w-90 fixed right-5 top-20 h-[88vh] overflow-y-auto bg-background">
                                        <RequestPrediction
                                            requestPredictionData={requestPredictionData}
                                            requestRecommendationData={requestRecommendationData}
                                            isPredictionLoading={isPredictionLoading}
                                            requestTimestamp={requestTimestamp}
                                            handlePredictionRequest={handlePredictionRequest}
                                        />
                                    </div>
                                </div>
                            </main>
                        </>
                    )}
        </>
    );
}