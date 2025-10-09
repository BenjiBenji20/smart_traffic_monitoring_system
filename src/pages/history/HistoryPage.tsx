import { DashboardNav } from "@/components/nav/DashboardNav";
import { ErrorPage } from "../error/ErrorPage";
import { useNavigate } from "react-router";
import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar";
// import { PredictionSummarySection } from "@/components/sections/PredictionSummarySection";
// import { PredictionDetailSection } from "@/components/sections/PredictionDetailSection";
// import { HiddenChartRenderer } from "@/components/chart/HiddenChartRenderer";
// import { DownloadButton } from "@/components/download-button/DownloadButton";
import { useEffect, useState } from "react";
import type { UserModel } from "@/types/user_model";
import { getUserProfile } from "@/api/user_api";
import { toast } from "sonner";

export function HistoryPage() {
    const [userData, setUserData] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showErrorPage, setShowErrorPage] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);

    const navigator = useNavigate();

    useEffect(() => {
        const fetchAllHistoryData = async () => {
            try {
                setIsLoading(true);

                // wait for your auth context to be ready
                await new Promise(resolve => setTimeout(resolve, 1000));

                const user = await getUserProfile();
                setUserData(user);

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

    if (isLoading) {
        return <></>; // return history page skeleton
    }

    return (
        <>
            <title>C4Vision - History</title>
            {
                !userData || isError || showErrorPage ? //||
                    // !predictionSummaryData || !predictionDetailData || !recommendationDetailData ?
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

                                            {/* ALL SECTIONS */}
                                            <div className="space-y-6 max-w-[845px]">
                                                {/* Prediction Summary Section */}
                                                {/* <div id="prediction-summary-section">
                                                    <PredictionSummarySection
                                                        summaryData={predictionSummaryData}
                                                        isLoading={false}
                                                        requestTimestamp={requestTimestamp}
                                                        AIRecommendationData={recommendationDetailData?.summary_reco}
                                                    />
                                                </div> */}

                                                {/* Prediction Detail Section */}
                                                {/* <div id="prediction-detailed-section">
                                                    <PredictionDetailSection
                                                        predictionChartData={predictionDetailData}
                                                        isLoading={false}
                                                        requestTimestamp={requestTimestamp}
                                                        AIRecommendationData={recommendationDetailData as unknown as Record<string, string>}
                                                    />
                                                </div> */}

                                                <div id="download-reports-section">
                                                    {/* Hidden Chart Renderer for PDF */}
                                                    {/* <HiddenChartRenderer
                                                        data={predictionDetailData}
                                                        onChartsReady={handleChartsReady}
                                                    /> */}

                                                    {/* Download Button with Modal */}
                                                    {/* <DownloadButton
                                                        payload={downloadPayload!}
                                                        disabled={!downloadPayload || !isChartsReady}
                                                        variant="outline"
                                                    /> */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right side - Fixed Prediction Panel */}
                                    <div id="history-selection" className="w-90 fixed right-5 top-20 h-[88vh] overflow-y-auto bg-background">
                                    </div>
                                </div>
                            </main>
                        </>
                    )}
        </>
    );
}