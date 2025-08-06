from fastapi.responses import JSONResponse
from datetime import datetime, timezone


def error_response(detail: str, error_code: str, status_code: int):
  return JSONResponse(
    status_code=status_code, # actual status code client response
    content={
      "error": {
        "status_code": status_code,
        "error_code": error_code,
        "detail": detail,
        "timestamp": datetime.now(timezone.utc).isoformat()
      }
    }
  )