from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.exceptions import HTTPException
from pydantic import ValidationError

from src.app.schemas.request_schema import DownloadDataRequest, PDFRequest
from src.app.models.user import User
from src.app.services.auth_service import get_current_user
from src.app.services.report_file_service import *
from src.app.exceptions.custom_exceptions import FileDownloadException

dl_file_router = APIRouter(
  prefix="/api/dashboard/download-file",
  tags=["admin dashboard download file"]
)

import json
@dl_file_router.post("/json")
async def dl_dot_json(req_payload: DownloadDataRequest): 
  """Download JSON file in byte format"""
  try:
    reco_data: dict = await formatted_ai_recommendation( req_payload.recommendation)
    
    if not reco_data:
      raise FileDownloadException(f"JSON file download failed due to error in {reco_data}")
    
    json_data: dict = formatted_json_dl_file(
      req_payload.prediction_summary, 
      req_payload.prediction_detail, 
      reco_data
    )
    
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
@dl_file_router.post("/xlsx")
async def dl_dot_xlsx(req_payload: DownloadDataRequest):
  """Download excel file"""
  try:
    reco_data: dict = await formatted_ai_recommendation( req_payload.recommendation)
    
    if not reco_data:
      raise FileDownloadException(f"Excel file download failed due to error in {reco_data}")
    
    excel_file: io.BytesIO = await generate_excel_file(
      req_payload.prediction_summary, 
      req_payload.prediction_detail, 
      reco_data
    )
    
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
  

@dl_file_router.post("/pdf")
async def dl_dot_pdf(request: PDFRequest, user: User = Depends(get_current_user)):
  try:
    pdf_file: io.BytesIO = await generate_pdf_file(request, user)
    if not pdf_file:
      raise FileDownloadException(f"Failed to download PDF file")

    headers = {
      "Content-Disposition": f'attachment; filename="{file_name("pdf")}"'
    }
    return StreamingResponse(pdf_file, media_type="application/pdf", headers=headers)
  except HTTPException:
    raise 
  