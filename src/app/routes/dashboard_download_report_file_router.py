from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.exceptions import HTTPException

from src.app.models.user import User
from src.app.services.auth_service import get_current_user
from src.app.services.report_file_service import *
from src.app.exceptions.custom_exceptions import FileDownloadException

dl_file_router = APIRouter(
  prefix="/api/dashboard/download-file",
  tags=["admin dashboard download file"]
)

import json
@dl_file_router.get("/json")
async def dl_dot_json(user: User = Depends(get_current_user)): 
  """Download JSON file in byte format"""
  try:
    pred_data: dict = pred_json()
    reco_data: dict = await formatted_ai_recommendation(user.role)
    
    if not pred_data or not reco_data:
      raise FileDownloadException(f"JSON file download failed due to error in {pred_data} or {reco_data}")
    
    json_data: dict = formatted_json_dl_file(pred_data, reco_data)
    
    full_file_path = os.path.join(download_path(), file_name("json"))
    
    with open(full_file_path, "w") as f:
      json.dump(json_data, f, indent=2)
    
    # return file as json
    return FileResponse(
      path=full_file_path,
      media_type="application/octet-stream",
      filename=os.path.basename(full_file_path)
    )
  except HTTPException:
    raise 


import io
@dl_file_router.get("/xlsx")
async def dl_dot_xlsx(user: User = Depends(get_current_user)):
  """Download excel file"""
  try:
    excel_file: io.BytesIO = await generate_excel_file(user.role)
    if not excel_file:
      raise FileDownloadException(f"Failed to download excel file")
    
    f_name = file_name("xlsx")
    
    return StreamingResponse(
      excel_file,
      media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      headers={"Content-Disposition": f"attachment; filename={f_name}"}
    )
  except HTTPException:
    raise 