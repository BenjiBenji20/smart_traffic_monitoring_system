export interface DetectedObject {
    label: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface DetectionData {
    objects: DetectedObject[];
    timestamp?: string;
}

export interface VehicleCounts {
    car: number;
    truck: number;
    bicycle: number;
    motorcycle: number;
    jeepney: number;
    tricycle: number;
}

export interface StatsResponse {
    vehicle_counts: VehicleCounts;
    total_count: number;
}

export interface LivestreamStatus {
    running: boolean;
    available_sources: string[];
    current_source?: string;
    detection_mode?: 'raw' | 'processed';
}

export interface StartLivestreamRequest {
    camera_source: string | null;
    detection_mode: 'raw' | 'processed';
}

export interface ApiResponse {
    success: boolean;
    message?: string;
    camera_source?: string;
}

export interface ConnectionTestResponse {
    connected: boolean;
    address: string;
}

export type DetectionMode = 'raw' | 'processed';

export interface ScaleFactors {
    x: number;
    y: number;
}

export interface ChangeLimitAngleRequest {
    degree_angle: number;
    side: string;
}

export interface ChangeLimitAngleResponse {
    limit: number [];
    message: string;
}