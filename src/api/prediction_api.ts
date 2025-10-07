import type { RequestPredictionRequest, RequestPredictionResponse } from "@/models/prediction.types";
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
