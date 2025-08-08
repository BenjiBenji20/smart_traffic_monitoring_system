from src.app.core.settings import settings

PUBLIC_ROUTES = {
  "/api/user/register",
  "/api/user/auth/token",
  "/api/dashboard/end-user-prediction-req"
}

CLIENT_ORIGINS = [
  settings.CLIENT_ORIGINS
]