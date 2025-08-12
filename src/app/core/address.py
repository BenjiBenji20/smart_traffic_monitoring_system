from src.app.core.settings import settings

PUBLIC_ROUTES = {
  "/docs",
  "/api/user/register",
  "/api/user/auth/token",
  "/api/dashboard/user/end-user-prediction-req",
  "/api/dashboard/user/end-user-traffic-recommendations",
  "/api/dashboard/user/end-user-traffic-req-recommendations",
  "/api/dashboard/livestream/start-livestream",
  "/api/dashboard/livestream/stop-livestream",
  "/api/dashboard/livestream/livestream-status",
  "/api/dashboard/livestream/test-pi-connection",
  "/api/dashboard/livestream/video-feed/raw",
  "/api/dashboard/livestream/video-feed/processed",
  "/api/dashboard/livestream/video-feed",
  "/api/dashboard/livestream/detection-data",
  "/api/dashboard/livestream/stats"
}

CLIENT_ORIGINS = [
  settings.CLIENT_ORIGINS
]