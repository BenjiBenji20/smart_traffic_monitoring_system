import { DashboardSidebar } from "../../components/sidebar/DashboardSidebar"
import { DashboardNav } from "../../components/nav/DashboardNav"
import { useEffect, useState } from "react"
import type { UserModel } from "@/models/user_model"
import { getUserProfile } from "@/api/user_api";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/skeleton/dashboard-page-skeleton";
import { DashboardLivestreamSection } from "@/components/livestream/LivestreamContainer";
import { ErrorPage } from "../error/ErrorPage";
import { useNavigate } from "react-router";
import { PredictionChart } from "@/components/chart/PredictionChart";
import type { RequestPredictionResponse } from "@/models/prediction.types";
import { predictionRequest } from "@/api/prediction_api";
import { PredictionRequestForm } from "@/components/ui/prediction-request-form";

export function DashboardPage() {
    const [userData, setUserData] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showErrorPage, setShowErrorPage] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [requestPredictionData, setRequestPredictionData] =
        useState<RequestPredictionResponse | null>(null);
    const navigator = useNavigate();

    useEffect(() => {
        const fetchAllData = async () => {
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

        fetchAllData();
    }, []);

    const handlePredictionRequest = async (endDate: string) => {
        try {
            // Fetch prediction data
            const predictionData = await predictionRequest({ end: endDate });
            setRequestPredictionData(predictionData);
            setIsError(false);
        } catch (error) {
            console.error("Failed to fetch prediction request data:", error);
            setIsError(true);
            toast.error("Failed to load prediction request data");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div><DashboardPageSkeleton /></div>;
    }

    return (
        <>
            {!userData || isError || showErrorPage ? (
                <ErrorPage
                    title="Failed to load data"
                    message="Could not connect to the server. Please check your connection."
                    onRetry={() => window.location.reload()}
                    onGoHome={() => navigator('/')}
                />
            ) : (
                <>
                    <DashboardNav userData={userData} />

                    {/* Main content with sidebar offset */}
                    <main className="ml-64 p-6 min-h-screen">
                        <div className="space-y-6">
                            <DashboardSidebar userData={userData} />
                            <DashboardLivestreamSection />
                            <h1 className="text-3xl font-bold">Modern Dashboard</h1>
                            <p>Clean, borderless design for 2025</p>

                            {/* dashboard content here */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
                                    Card 1
                                </div>
                                <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
                                    Card 2
                                </div>
                                <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
                                    Card 3
                                </div>
                            </div>

                            <div className="container mx-auto p-10">
                                {/* Only show chart if prediction data exists */}
                                {requestPredictionData && (
                                    <PredictionChart
                                        data={requestPredictionData?.forecast || null}
                                        title="Request Traffic Prediction"
                                        height={200}
                                        width="50%"
                                    />
                                )}

                                {/* Prediction request form */}
                                <PredictionRequestForm
                                    onRequestPrediction={handlePredictionRequest}
                                    isLoading={isLoading}
                                />
                            </div>
                        </div>
                    </main>
                </>
            )}
        </>
    );
}