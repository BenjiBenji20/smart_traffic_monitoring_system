from src.app.core.settings import settings

PUBLIC_ROUTES = {
  "/docs",
  "/api/user/register",
  "/api/user/auth/token",
  "/api/dashboard/end-user-prediction-req",
  "/api/dashboard/end-user-traffic-recommendations",
  "/api/dashboard/end-user-traffic-req-recommendations",
  "/api/dashboard/start-livestream",
  "/api/dashboard/stop-livestream",
  "/api/dashboard/livestream-status",
  "/api/dashboard/test-pi-connection",
  "/api/dashboard/video-feed/raw",
  "/api/dashboard/video-feed/processed",
  "/api/dashboard/video-feed",
  "/api/dashboard/detection-data",
  "/api/dashboard/stats"
}

CLIENT_ORIGINS = [
  settings.CLIENT_ORIGINS
]