from src.app.core.settings import settings

PUBLIC_ROUTES = {
  r"/docs",
  r"/openapi.json",
  r"/api/user/register",
  r"/api/user/auth/token",
  r"/api/user/auth/refresh2",
  r"/api/dashboard/user/end-user-prediction-req",
  r"/api/dashboard/user/end-user-traffic-recommendations",
  r"/api/dashboard/user/end-user-traffic-req-recommendations",
  r"/api/dashboard/livestream/start-livestream",
  r"/api/dashboard/livestream/stop-livestream",
  r"/api/dashboard/livestream/livestream-status",
  r"/api/dashboard/livestream/test-pi-connection",
  r"/api/dashboard/livestream/video-feed/raw",
  r"/api/dashboard/livestream/video-feed/processed",
  r"/api/dashboard/livestream/video-feed",
  r"/api/dashboard/livestream/detection-data",
  r"/api/dashboard/livestream/stats",
  r"/api/dashboard/livestream/switch-detection-mode",
  r"/api/dashboard/livestream/change-limit",
  r"/api/dashboard/livestream/ws/detection-stream",
  r"/api/user/action/ws/chat",
  r"/api/user/action/ws/group-chat"
}


import re
def match_uri(request_uri: str) -> bool:
    return True if any(re.match(pattern, request_uri) for pattern in PUBLIC_ROUTES) else False

CLIENT_ORIGINS = [
  settings.CLIENT_ORIGINS,
  settings.REACT_CLIENT_ORIGIN
]