import type {
    trafficFactorsAnalysis,
    trafficRecommendationDict,
    trafficRecommendationStr
} from "@/types/ai_recommendation.types";
import type { RequestPredictionRequest } from "@/types/prediction.types";
import { formatDateWithoutMS } from "@/utils/format-date";
import securedRequest from "./authentication_api";

const BASEURL = "/dashboard/user";

export async function recommendationStr(
    request: Omit<RequestPredictionRequest, 'start'>
): Promise<trafficRecommendationStr> {
    const formattedRequest: RequestPredictionRequest = {
        start: formatDateWithoutMS(new Date()),
        end: formatDateWithoutMS(request.end)
    };

    const response = await securedRequest.post<trafficRecommendationStr>(
        `${BASEURL}/admin-traffic-req-recommendations`,
        formattedRequest
    );

    return response.data;
}


export async function recommendationDict(): Promise<trafficRecommendationDict> {
    const response = await securedRequest.get<trafficRecommendationDict>(
        `${BASEURL}/admin-traffic-recommendations`
    );

    return response.data;
}


export async function recommendationFactorsAnalysis(): Promise<trafficFactorsAnalysis> {
    const response = await securedRequest.get<trafficFactorsAnalysis>(
        `${BASEURL}/ai-analysis`
    );

    return response.data;
}