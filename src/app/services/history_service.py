from typing import List
import logging
from sqlalchemy import UUID, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.exceptions.custom_exceptions import InternalServerError
from src.app.models.history import History
from src.app.schemas.history_schema import HistoryResponseSchema

async def get_all_history_service(db: AsyncSession) -> List[HistoryResponseSchema]:
  try:
    result = await db.execute(
      select(
        History.id,
        History.created_at, 
        History.version_name
      ).order_by(History.created_at.desc())
      .limit(60) # 2 months record
    )
    
    # Get all records as tuples
    records = result.all()
    
    return [
      HistoryResponseSchema(
        id=str(record.id),
        created_at = record.created_at,
        version_name = record.version_name
      )
      for record in records
    ]
  except Exception as e:
    logging.error(f"An error occured while fetching all history record: {e}")
    return []
    
    