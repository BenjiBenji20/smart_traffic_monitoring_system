from datetime import datetime
from fastapi import APIRouter, Depends, Request
import asyncio

from src.app.models.user import User
from src.app.schemas.user_schema import UserSchema
from src.app.exceptions.custom_exceptions import *
from src.app.services.auth_service import get_current_user
from src.app.schemas.request_schema import AdminPredictionRequest, EndUserPredictionRequest

# traffic predictions
from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import (
  prediction_summary, prediction_detail, admin_prediction_req, user_prediction_req
)


dashboard_router = APIRouter(prefix="/api/dashboard")

# enables stateless access
# request object is a middleware from middleware.jwt_filter_middleware.py
@dashboard_router.get("/user-profile", response_model=UserSchema)
async def get_user_profile(user: User = Depends(get_current_user)): 
  if not user:
    raise ResourceNotFoundException("No user found.")
  return user


# get traffic prediction
# from src.traffic_ai.traffic_prediction_json_bldr.py
# private endpoint
@dashboard_router.get("/prediction-summary")
async def get_prediction_summary() -> dict:
  return await asyncio.to_thread(prediction_summary)


# from src.traffic_ai.traffic_prediction_json_bldr.py
# private endpoint
@dashboard_router.get("/prediction-detail")
async def get_prediction_detail() -> dict:
  return await asyncio.to_thread(prediction_detail)


# from src.traffic_ai.traffic_prediction_json_bldr.py
# private endpoint
@dashboard_router.post("/admin-prediction-req")
async def admin_prediction_req(req: AdminPredictionRequest) -> dict: # pass the current datetime as default start
  req_dict: dict = req.model_dump()
  return await asyncio.to_thread(admin_prediction_req, req_dict) # pass req_dict as self arg of first arg


# from src.traffic_ai.traffic_prediction_json_bldr.py
# public endpoint
@dashboard_router.post("/end-user-prediction-req")
async def enduser_prediction_req(req: EndUserPredictionRequest) -> dict:
  req_dict: dict = req.model_dump()
  return await asyncio.to_thread(user_prediction_req, req_dict) 