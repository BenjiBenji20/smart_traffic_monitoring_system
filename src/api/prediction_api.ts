import type { PredictionData, PredictionFactorsAnalysis, PredictionSummary, RequestPredictionRequest, RequestPredictionResponse } from "@/types/prediction.types";
import securedRequest from "./authentication_api";
import { formatDateWithoutMS } from "@/utils/format-date";

const BASEURL = "/dashboard/user";

export async function predictionRequest(
    request: Omit<RequestPredictionRequest, 'start'>
): Promise<RequestPredictionResponse> {
    // Auto-generate start date (current time) and format both
    const formattedRequest: RequestPredictionRequest = {
        start: formatDateWithoutMS(new Date()), // Current time as start
        end: formatDateWithoutMS(request.end)   // Format the provided end date
    };

    const response = await securedRequest.post<RequestPredictionResponse>(
        `${BASEURL}/admin-prediction-req`,
        formattedRequest,
    );

    return response.data;
}


export async function predictionSummary(): Promise<PredictionSummary> {
    const response = await securedRequest.get<PredictionSummary>(
        `${BASEURL}/prediction-summary`
    );

    return response.data;
}


export async function predictionDetail(): Promise<PredictionData> {
    const response = await securedRequest.get<PredictionData>(
        `${BASEURL}/prediction-detail`
    );

    return response.data;
}


export async function predictionFactorsAnalysis(): Promise<PredictionFactorsAnalysis> {
    const response = await securedRequest.get<PredictionFactorsAnalysis>(
        `${BASEURL}/factors`
    );

    return response.data;
}