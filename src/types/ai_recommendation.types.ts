export type trafficRecommendationStr = string;

export interface trafficFactorsAnalysis {
    hourly: string;
    daily: string;
    weekly: string;
    monthly: string;
}

export interface trafficRecommendationDict extends trafficFactorsAnalysis {
    summary: string;
}
