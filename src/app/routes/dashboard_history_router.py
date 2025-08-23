import logging
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.db.db_session import get_async_db
from src.app.schemas.history_schema import HistoryListSchema, HistoryResponseSchema
from src.app.services.history_service import get_all_history_service


dashboard_history_router = APIRouter(
  prefix="/api/dashboard/history",
  tags=["admin dashboard history"]
)

@dashboard_history_router.get("/all-history", response_model=HistoryListSchema)
async def get_all_history(db: AsyncSession = Depends(get_async_db)):
  try:
    all_history: List[HistoryResponseSchema] = await get_all_history_service(db)
    
    return HistoryListSchema(
      data=all_history
    )
  except Exception as e:
    logging.error(f"Error in get_all_history endpoint: {e}")
    raise