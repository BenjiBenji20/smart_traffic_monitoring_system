from typing import List
import logging
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.exceptions.custom_exceptions import ResourceNotFoundException
from src.app.models.history import History
from src.app.schemas.history_schema import HistoryResponseSchema, HistorySchema

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
  
  
async def get_history_by_id_service(id: str, db: AsyncSession) -> HistorySchema:
  try:
    result = await db.execute(
      select(History)
      .where(History.id == id)
    )
    
    response = result.scalar_one_or_none()
    
    if not response:
      raise ResourceNotFoundException(f"History record not found by id: {id}")
    
    return response
  
  except Exception as e:
    logging.error(f"An error occured while fetching history record by id:{id} Error: {e}")
    raise
    

async def update_version_name_service(id: str, new_ver_name: str, db: AsyncSession) -> bool:
  try:
    result = await db.execute(select(History).where(History.id == id))
    response = result.scalar_one_or_none()
    
    if not response:
      raise ResourceNotFoundException(f"History record not found by id: {id}")
    
    # validate if still same name
    if response.version_name == new_ver_name:
      return True # immediately stop this bullshit
    
    # update version_name field only
    stmt = (
      update(History)
      .where(History.id == id)
      .values(version_name=new_ver_name)
      .execution_options(synchronize_session="fetch")
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    return result.rowcount > 0  # True if updated, False if not
  except Exception as e:
    await db.rollback() # rollback if something went wrong
    logging.error(f"Error updating version name: {e}")
    raise