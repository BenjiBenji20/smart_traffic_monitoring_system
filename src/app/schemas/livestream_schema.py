from typing import List, Optional

from pydantic import BaseModel


class StartLivestreamRequest(BaseModel):
  camera_source: Optional[str] = None  # If not provided, will auto-detect

class LivestreamResponse(BaseModel):
  success: bool
  message: str
  camera_source: Optional[str] = None
  available_sources: Optional[List[str]] = None

class AddressIndex(BaseModel):
  address_index: int

class SwitchModeRequest(BaseModel):
  mode: str