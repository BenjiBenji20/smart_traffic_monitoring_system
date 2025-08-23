import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.db.db_session import get_async_db
from src.app.schemas.history_schema import *
from src.app.services.history_service import (
  get_all_history_service, 
  get_history_by_id_service, 
  update_version_name_service
)


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
  

@dashboard_history_router.get("/one-history", response_model=HistorySchema)
async def get_history_by_id(id: str, db: AsyncSession = Depends(get_async_db)):
  try:
    response = await get_history_by_id_service(id, db)
    
    return HistorySchema(
      version_name=response.version_name,
      prediction_summary=response.prediction_summary,
      prediction_detail=response.prediction_detail,
      ai_recommendation=response.ai_recommendation
    )
  except Exception as e:
    logging.error(f"Error in get_history_by_id endpoint: {e}")
    raise
    
    
@dashboard_history_router.put("/update-version-name", response_model=HistorySchema)
async def update_version_name(id: str, new_ver_name: str, db: AsyncSession = Depends(get_async_db)):
  try:
    is_updated = await update_version_name_service(id, new_ver_name, db)
    
    if not is_updated:
      raise HTTPException(status_code=400, detail="Failed to update version name")
    
    # query the updated version name to use by client
    response = await get_history_by_id_service(id, db)
    
    return HistorySchema(
      version_name=response.version_name,
      prediction_summary=response.prediction_summary,
      prediction_detail=response.prediction_detail,
      ai_recommendation=response.ai_recommendation
    )
  except Exception as e:
    logging.error(f"Error in update_version_name endpoint: {e}")
    raise