// PREDICTION DETAILED
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

// TRAFFIC SUMMARY ANALYTICS
export type TrafficCondition = 'moderate' | 'congested';

export interface AnalyticsPoint {
    value: number;
    condition: TrafficCondition;
}

export interface TimeAnalyticsPoint extends AnalyticsPoint {
    time: string;
}

export interface DateAnalyticsPoint extends AnalyticsPoint {
    date: string;
}

export interface MonthAnalyticsPoint extends AnalyticsPoint {
    month: string;
}

// Analytics containers
export interface TodayAnalytics {
    peak: TimeAnalyticsPoint;
    low: TimeAnalyticsPoint;
    avg: number;
}

export interface WeeklyAnalytics {
    peak: DateAnalyticsPoint;
    low: DateAnalyticsPoint;
    avg: number;
}

export interface ThreeMonthsAnalytics {
    peak: MonthAnalyticsPoint;
    low: MonthAnalyticsPoint;
    avg: number;
}

// Date range interface
export interface DateRange {
    start: string;
    end: string;
}

// Main analytics response interface
export interface PredictionSummary {
    today: string;
    vhcl_today_sum: number;
    today_analytics: TodayAnalytics;
    current_week_range: DateRange;
    vhcl_current_week_sum: number;
    weekly_analytics: WeeklyAnalytics;
    three_months_range: DateRange;
    vhcl_three_months_sum: number;
    three_months_analytics: ThreeMonthsAnalytics;
}

// TRAFFIC FACTORS
// Contributing factor for predictions
export interface ContributingFactor {
    factor: string;
    impact: number;
    reason: string;
}

// Base interface for all prediction details
interface BasePredictionFactor {
    base_traffic: number;
    contributing_factors: ContributingFactor[];
    net_impact: number;
    final_prediction: number;
}

// Hourly prediction with factors
export interface HourlyPredictionFactor extends BasePredictionFactor {
    time: string;
}

// Daily prediction with factors
export interface DailyPredictionFactor extends BasePredictionFactor {
    date: string;
}

// Weekly prediction with factors
export interface WeeklyPredictionFactor extends BasePredictionFactor {
    week_start: string;
}

// Monthly prediction with factors
export interface MonthlyPredictionFactor extends BasePredictionFactor {
    month: string;
}

// Complete prediction factors response
export interface PredictionFactorsAnalysis {
    hourly?: HourlyPredictionFactor[];
    daily?: DailyPredictionFactor[];
    weekly?: WeeklyPredictionFactor[];
    monthly?: MonthlyPredictionFactor[];
}