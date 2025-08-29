from fastapi import APIRouter
import asyncio

from src.app.models.user import User
from src.app.schemas.user_schema import UserSchema
from src.app.exceptions.custom_exceptions import *

from src.app.schemas.request_schema import EndUserPredictionRequest

# traffic predictions
from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import (
  prediction_summary, prediction_detail, admin_prediction_req, user_prediction_req
)
# traffic recommendations
from src.traffic_ai.traffic_recommendation.traffic_recommendation_ai import AIRecommendation

dashboard_user_router = APIRouter(
    prefix="/api/dashboard/user", 
    tags=["public routes"]
  )


# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# public endpoint
@dashboard_user_router.post("/end-user-prediction-req")
async def enduser_prediction_request(req: EndUserPredictionRequest) -> dict:
  req_dict: dict = req.model_dump()
  return await asyncio.to_thread(user_prediction_req, req_dict)


# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# public endpoint
@dashboard_user_router.get("/end-user-prediction-detail")
async def get_prediction_detail() -> dict:
  return await asyncio.to_thread(prediction_detail)


# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# public endpoint
@dashboard_user_router.get("/end-user-prediction-summary")
async def get_prediction_summary() -> dict:
  return await asyncio.to_thread(prediction_summary)


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
# public endpoint
@dashboard_user_router.post("/end-user-traffic-req-recommendations")
async def admin_traffic_req_recommendations(req: EndUserPredictionRequest) -> str:
  model = AIRecommendation()
  req_dict: dict = req.model_dump()
  prediction_data = user_prediction_req(req_dict)

  return await asyncio.to_thread(model.traffic_request_reco, prediction_data, "end_user")

