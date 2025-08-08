from src.app.core.settings import settings

PUBLIC_ROUTES = {
  "/api/user/register",
  "/api/user/auth/token",
  "/api/dashboard/end-user-prediction-req",
  "/api/dashboard/end-user-traffic-recommendations",
  "/api/dashboard/end-user-traffic-req-recommendations"
}

CLIENT_ORIGINS = [
  settings.CLIENT_ORIGINS
]