/* eslint-disable @typescript-eslint/no-explicit-any */
export interface HistoryData {
    version_name: string
    prediction_summary: Record<string, any>;
    prediction_detail: Record<string, any>;
    ai_recommendation: Record<string, any>;
}

export interface HistoryResponseData {
    id: string; // UUID as string 
    created_at: string; // date as ISO string
    version_name: string;
}

export interface HistoryListData {
    status: boolean;
    message: string;
    data: HistoryResponseData[];
    timestamp: string; // datetime as ISO string
}