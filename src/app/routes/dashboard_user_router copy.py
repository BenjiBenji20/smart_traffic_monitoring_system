from fastapi import APIRouter, Depends
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
# traffic recommendations
from src.traffic_ai.traffic_recommendation.traffic_recommendation_ai import AIRecommendation

dashboard_user_router = APIRouter(
    prefix="/api/dashboard/user", 
    tags=["admin dashboard"]
  )

# enables stateless access
# request object is a middleware from middleware.jwt_filter_middleware.py
@dashboard_user_router.get("/user-profile", response_model=UserSchema)
async def get_user_profile(user: User = Depends(get_current_user)): 
  if not user:
    raise ResourceNotFoundException("No user found.")
  return user


# get traffic prediction
# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# private endpoint
@dashboard_user_router.get("/prediction-summary")
async def get_prediction_summary() -> dict:
  return await asyncio.to_thread(prediction_summary)


# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# private endpoint
@dashboard_user_router.get("/prediction-detail")
async def get_prediction_detail() -> dict:
  return await asyncio.to_thread(prediction_detail)


# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# private endpoint
@dashboard_user_router.post("/admin-prediction-req")
async def admin_prediction_request(req: AdminPredictionRequest) -> dict: # pass the current datetime as default start
  req_dict: dict = req.model_dump()
  return await asyncio.to_thread(admin_prediction_req, req_dict) # pass req_dict as self arg of first arg


# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# public endpoint
@dashboard_user_router.post("/end-user-prediction-req")
async def enduser_prediction_request(req: EndUserPredictionRequest) -> dict:
  req_dict: dict = req.model_dump()
  return await asyncio.to_thread(user_prediction_req, req_dict)


# get ai generated recommendations
# from src/traffic_ai/traffic_recommendation/traffic_recommendation_ai.py
# private endpoint
@dashboard_user_router.get("/admin-traffic-recommendations")
async def admin_traffic_recommendations(user: User = Depends(get_current_user)) -> dict:
  model = AIRecommendation() 
  d1 = prediction_summary()
  d2 = prediction_detail()

  await asyncio.to_thread(model.run_ai_recommendation, d1=d1, d2=d2, user_type=user.role)
  return model.reco_json


# from src/traffic_ai/traffic_recommendation/traffic_recommendation_ai.py
# public endpoint
@dashboard_user_router.get("/end-user-traffic-recommendations")
async def end_user_traffic_recommendations() -> dict:
  model = AIRecommendation() 
  d1 = prediction_summary()
  d2 = prediction_detail()

  await asyncio.to_thread(model.run_ai_recommendation, d1=d1, d2=d2, user_type="end_user")
  return model.reco_json


# from src/traffic_ai/traffic_recommendation/traffic_recommendation_ai.py
# private endpoint
@dashboard_user_router.post("/admin-traffic-req-recommendations")
async def admin_traffic_req_recommendations(
  req: AdminPredictionRequest, user: User = Depends(get_current_user)) -> str:
  model = AIRecommendation()
  req_dict: dict = req.model_dump()
  prediction_data = admin_prediction_req(req_dict)

  return await asyncio.to_thread(model.traffic_request_reco, prediction_data, user.role)


# from src/traffic_ai/traffic_recommendation/traffic_recommendation_ai.py
# public endpoint
@dashboard_user_router.post("/end-user-traffic-req-recommendations")
async def admin_traffic_req_recommendations(req: EndUserPredictionRequest) -> str:
  model = AIRecommendation()
  req_dict: dict = req.model_dump()
  prediction_data = user_prediction_req(req_dict)

  return await asyncio.to_thread(model.traffic_request_reco, prediction_data, "end_user")

