// pages/history/HistoryPage.tsx
import { DashboardNav } from "@/components/nav/DashboardNav";
import { ErrorPage } from "../error/ErrorPage";
import { useNavigate } from "react-router";
import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar";
import { PredictionSummarySection } from "@/components/sections/PredictionSummarySection";
import { PredictionDetailSection } from "@/components/sections/PredictionDetailSection";
import { HiddenChartRenderer } from "@/components/chart/HiddenChartRenderer";
import { DownloadButton } from "@/components/download-button/DownloadButton";
import { useCallback, useEffect, useState } from "react";
import type { UserModel } from "@/types/user_model";
import { getUserProfile } from "@/api/user_api";
import { toast } from "sonner";
import type { HistoryData, HistoryListData } from "@/types/history.types";
import { getAllHistoryRecord, getOneHistoryRecord, updateVersionName } from "@/api/history_api";
import { HistoryListSidebar } from "@/components/sidebar/HistoryListSidebar";
import { ChartCaptureService } from "@/services/chart-capture-service";
import type { PredictionData, PredictionSummary } from "@/types/prediction.types";
import type { trafficRecommendationDict } from "@/types/ai_recommendation.types";
import { HistoryPageSkeleton } from "@/components/skeleton/HistoryPageSkeleton";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatContainer } from "@/components/chat/ChatContainer";


export function HistoryPage() {
    const [userData, setUserData] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showErrorPage, setShowErrorPage] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);

    const [historyListData, setHistoryListData] = useState<HistoryListData | null>(null);
    const [historyData, setHistoryData] = useState<HistoryData | null>(null);

    const navigator = useNavigate();

    const handleVersionSelect = async (id: string) => {
        const historyResponse = await getOneHistoryRecord(id);
        setHistoryData(historyResponse);
    };

    useEffect(() => {
        const fetchAllHistoryData = async () => {
            try {
                setIsLoading(true);

                await new Promise(resolve => setTimeout(resolve, 1000));

                const user = await getUserProfile();
                setUserData(user);

                const historyListResponse = await getAllHistoryRecord();
                setHistoryListData(historyListResponse);

                if (historyListResponse.data.length > 0) {
                    const firstRecord = historyListResponse.data[0];
                    await handleVersionSelect(firstRecord.id);
                }

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

        fetchAllHistoryData();
    }, []);

    const chartCaptureService = new ChartCaptureService();
    const [isChartsReady, setIsChartsReady] = useState(false);

    const handleChartsReady = useCallback((chartRefs: Map<string, HTMLDivElement>) => {
        chartCaptureService.registerChartContainers(chartRefs);
        setIsChartsReady(true);
    }, []);

    const handleVersionUpdate = async (id: string, newName: string) => {
        try {
            const success = await updateVersionName(id, newName);
            if (success) {
                setHistoryListData(prev =>
                    prev ? {
                        ...prev,
                        data: prev.data.map(item =>
                            item.id === id ? { ...item, version_name: newName } : item
                        )
                    } : null
                );
                toast.success('Version name updated successfully');
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            toast.error('Failed to update version name');
            throw error;
        }
    };

    if (isLoading) {
        return <><HistoryPageSkeleton /></>;
    }

    return (
        <>
            <title>C4Vision - History</title>
            {
                !userData || isError || showErrorPage || !historyListData ?
                    (
                        <ErrorPage
                            title="Failed to load data"
                            message="Could not connect to the server. Please check your connection."
                            onRetry={() => window.location.reload()}
                            onGoHome={() => navigator('/')}
                        />
                    ) : (
                        <ChatProvider currentUserId={userData.id}>
                            <div className="fixed top-0 left-0 right-0 z-50">
                                <DashboardNav userData={userData} />
                            </div>

                            <main className="ml-64 pt-16 min-h-screen">
                                <div className="flex">
                                    <div className="flex-1 p-6">
                                        <div className="space-y-6">
                                            <DashboardSidebar userData={userData} />

                                            <div className="space-y-6 max-w-[845px]">
                                                {historyData && (
                                                    <div className="space-y-6">
                                                        <h2 className="text-xl font-bold mb-4">
                                                            {historyData.version_name}
                                                        </h2>
                                                        <PredictionSummarySection
                                                            summaryData={
                                                                historyData.prediction_summary as PredictionSummary
                                                            }
                                                            isLoading={isLoading}
                                                            AIRecommendationData={historyData.ai_recommendation}
                                                            requestTimestamp={0}
                                                        />

                                                        <div id="prediction-detailed-section">
                                                            <PredictionDetailSection
                                                                predictionChartData={historyData.prediction_detail}
                                                                isLoading={false}
                                                                requestTimestamp={0}
                                                                AIRecommendationData={historyData.ai_recommendation as unknown as Record<string, string>}
                                                            />
                                                        </div>

                                                        <div id="download-reports-section">
                                                            <HiddenChartRenderer
                                                                data={historyData.prediction_detail}
                                                                onChartsReady={handleChartsReady}
                                                            />

                                                            <DownloadButton
                                                                payload={{
                                                                    prediction_summary:
                                                                        historyData.prediction_summary as PredictionSummary,
                                                                    prediction_detail:
                                                                        historyData.prediction_detail as PredictionData,
                                                                    recommendation:
                                                                        historyData.ai_recommendation as trafficRecommendationDict
                                                                }!}
                                                                disabled={!historyData || !isChartsReady}
                                                                variant="outline"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-90 fixed right-5 top-20 h-[88vh] overflow-y-auto bg-background">
                                        <HistoryListSidebar
                                            historyData={historyListData.data}
                                            onVersionSelect={handleVersionSelect}
                                            onVersionUpdate={handleVersionUpdate}
                                            className="h-full"
                                        />
                                    </div>
                                </div>
                            </main>

                            {/* Chat Container - renders all open chats */}
                            <ChatContainer />
                        </ChatProvider>
                    )}
        </>
    );
}