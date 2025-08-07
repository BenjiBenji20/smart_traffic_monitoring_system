from src.app.core.settings import settings

PUBLIC_ROUTES = {
  "/api/user/register",
  "/api/user/auth/token"
}

CLIENT_ORIGINS = [
  settings.CLIENT_ORIGINS
]