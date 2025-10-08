// types/prediction.ts
export interface RequestPredictionRequest {
    // strings to match ISO format from backend schema "2025-08-19T17:51:00"
    start: string; 
    end: string;
}

export interface HourlyPrediction {
    time: string;
    value: number;
}

export interface DailyPrediction {
    date: string;
    value: number;
}

export interface MonthlyPrediction {
    month_start: string;
    month_end: string;
    value: number;
}

export interface WeeklyPrediction {
    week_start: string;
    week_end: string;
    value: number;
}

export interface PredictionData {
    hourly?: HourlyPrediction[];
    daily?: DailyPrediction[];
    weekly?: WeeklyPrediction[];
    monthly?: MonthlyPrediction[];
}

export interface RequestPredictionResponse {
    request_date: RequestPredictionRequest; 
    forecast: PredictionData;
}

export type TimePeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type ChartType = 'line' | 'bar' | 'area';
