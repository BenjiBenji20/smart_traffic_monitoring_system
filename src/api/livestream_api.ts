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
} from '@/types/livestream.types';

const API_BASE = '/dashboard/livestream';

// WebSocket connection singleton
let detectionWebSocket: WebSocket | null = null;
const detectionWebSocketListeners: Set<(data: DetectionUpdateMessage) => void> = new Set();

export interface DetectionUpdateMessage {
  type: 'detection_update';
  timestamp: number;
  data: {
    detections: DetectionData['objects'];
    stats: {
      total_count: number;
      vehicle_counts: Record<string, number>;
      status: 'running' | 'stopped';
    };
  };
}

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

  // Test Pi connection
  async testPiConnection(addressIndex?: number): Promise<ConnectionTestResponse> {
    const params = addressIndex !== undefined ? `?address_index=${addressIndex}` : '';
    const response = await securedRequest.get<ConnectionTestResponse>(
      `${API_BASE}/test-pi-connection${params}`
    );
    return response.data;
  },

  // Get video feed URL (MJPEG streams, keep as HTTP)
  getVideoFeedUrl(mode: DetectionMode): string {
    return `/api/dashboard/livestream/video-feed/${mode}?t=${Date.now()}`;
  },

  // ===== WEBSOCKET METHODS =====

  /**
   * Connect to WebSocket for real-time detection updates
   * Replaces polling for detection-data and stats
   */
  connectDetectionWebSocket(onMessage: (data: DetectionUpdateMessage) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (detectionWebSocket && detectionWebSocket.readyState === WebSocket.OPEN) {
        // Already connected
        detectionWebSocketListeners.add(onMessage);
        resolve();
        return;
      }

      try {
        // Determine protocol (ws or wss based on current location)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/dashboard/livestream/ws/detection-stream`;

        console.log(`[WebSocket] Connecting to ${wsUrl}`);
        detectionWebSocket = new WebSocket(wsUrl);

        detectionWebSocket.onopen = () => {
          console.log('[WebSocket] Connected');
          detectionWebSocketListeners.add(onMessage);
          resolve();
        };

        detectionWebSocket.onmessage = (event: MessageEvent) => {
          try {
            const data: DetectionUpdateMessage = JSON.parse(event.data);

            if (data.type === 'detection_update') {
              // Broadcast to all listeners
              detectionWebSocketListeners.forEach(listener => {
                try {
                  listener(data);
                } catch (error) {
                  console.error('[WebSocket] Error in listener:', error);
                }
              });
            }
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        detectionWebSocket.onerror = (error: Event) => {
          console.error('[WebSocket] Error:', error);
          reject(new Error('WebSocket connection failed'));
        };

        detectionWebSocket.onclose = () => {
          console.log('[WebSocket] Disconnected');
          detectionWebSocket = null;
          detectionWebSocketListeners.clear();
        };
      } catch (error) {
        console.error('[WebSocket] Failed to create connection:', error);
        reject(error);
      }
    });
  },

  /**
   * Register a listener for WebSocket updates
   */
  onDetectionUpdate(callback: (data: DetectionUpdateMessage) => void): () => void {
    detectionWebSocketListeners.add(callback);

    // Return unsubscribe function
    return () => {
      detectionWebSocketListeners.delete(callback);

      // Disconnect if no listeners remain
      if (detectionWebSocketListeners.size === 0) {
        livestreamApi.disconnectDetectionWebSocket();
      }
    };
  },

  /**
   * Disconnect WebSocket
   */
  disconnectDetectionWebSocket(): void {
    if (detectionWebSocket) {
      console.log('[WebSocket] Disconnecting');
      detectionWebSocket.close();
      detectionWebSocket = null;
      detectionWebSocketListeners.clear();
    }
  },

  /**
   * Check if WebSocket is connected
   */
  isDetectionWebSocketConnected(): boolean {
    return detectionWebSocket !== null && detectionWebSocket.readyState === WebSocket.OPEN;
  },

  // ===== FALLBACK HTTP METHODS (for backwards compatibility) =====

  /**
   * DEPRECATED: Use WebSocket instead.
   * Get current detection data (HTTP fallback)
   */
  async getDetectionData(): Promise<DetectionData> {
    const response = await securedRequest.get<DetectionData>(
      `${API_BASE}/detection-data`
    );
    return response.data;
  },

  /**
   * DEPRECATED: Use WebSocket instead.
   * Get vehicle stats (HTTP fallback)
   */
  async getStats(): Promise<StatsResponse> {
    const response = await securedRequest.get<StatsResponse>(
      `${API_BASE}/stats`
    );
    return response.data;
  }
};