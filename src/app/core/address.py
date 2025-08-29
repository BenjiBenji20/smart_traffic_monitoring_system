from src.app.core.settings import settings

PUBLIC_ROUTES = {
  "/docs",
  "/openapi.json",
  "/api/user/register",
  "/api/user/auth/token",
  "/api/dashboard/user/end-user-prediction-req",
  "/api/dashboard/user/end-user-traffic-recommendations",
  "/api/dashboard/user/end-user-traffic-req-recommendations",
  "/api/dashboard/user/end-user-prediction-detail",
  "/api/dashboard/user/end-user-prediction-summary"
}

CLIENT_ORIGINS = [
  settings.CLIENT_ORIGINS
]