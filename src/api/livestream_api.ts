// src/api/livestream_api.ts
import securedRequest from "./authentication_api";
import type {
  LivestreamStatus,
  StartLivestreamRequest,
  ApiResponse,
  DetectionData,
  StatsResponse,
  ConnectionTestResponse,
  DetectionMode
} from '@/models/livestream.types';

const API_BASE = '/dashboard/livestream';

export const livestreamApi = {
  // Get livestream status
  async getLivestreamStatus(): Promise<LivestreamStatus> {
    const response = await securedRequest.get<LivestreamStatus>(
      `${API_BASE}/livestream-status`
    );
    return response.data;
  },

  // Start livestream
  async startLivestream(params: StartLivestreamRequest): Promise<ApiResponse> {
    const response = await securedRequest.post<ApiResponse>(
      `${API_BASE}/start-livestream`,
      params
    );
    return response.data;
  },

  // Stop livestream
  async stopLivestream(): Promise<ApiResponse> {
    const response = await securedRequest.post<ApiResponse>(
      `${API_BASE}/stop-livestream`
    );
    return response.data;
  },

  // Switch detection mode
  async switchDetectionMode(mode: DetectionMode): Promise<ApiResponse> {
    const response = await securedRequest.post<ApiResponse>(
      `${API_BASE}/switch-detection-mode`,
      { mode }
    );
    return response.data;
  },

  // Get detection data (for raw mode)
  async getDetectionData(): Promise<DetectionData> {
    const response = await securedRequest.get<DetectionData>(
      `${API_BASE}/detection-data`
    );
    return response.data;
  },

  // Get vehicle stats
  async getStats(): Promise<StatsResponse> {
    const response = await securedRequest.get<StatsResponse>(
      `${API_BASE}/stats`
    );
    return response.data;
  },

  // Test Pi connection
  async testPiConnection(addressIndex?: number): Promise<ConnectionTestResponse> {
    const params = addressIndex !== undefined ? `?address_index=${addressIndex}` : '';
    const response = await securedRequest.get<ConnectionTestResponse>(
      `${API_BASE}/test-pi-connection${params}`
    );
    return response.data;
  },

  // Get video feed URL (these are direct URLs, not secured)
  getVideoFeedUrl(mode: DetectionMode): string {
    // MJPEG streams can't use axios, so we use direct URLs
    // Backend handles this without auth requirement
    return `/api/dashboard/livestream/video-feed/${mode}?t=${Date.now()}`;
  }
};