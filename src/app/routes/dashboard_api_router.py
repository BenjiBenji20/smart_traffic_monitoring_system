from datetime import datetime
import logging
import time
from fastapi import APIRouter, Depends, HTTPException
import asyncio

from fastapi.responses import StreamingResponse

from src.app.models.user import User
from src.app.schemas.user_schema import UserSchema
from src.app.exceptions.custom_exceptions import *
from src.app.services.auth_service import get_current_user
from src.app.services.dashboard_service import (
    generate_raw_stream, 
    generate_processed_stream, 
    get_current_detections,
    start_detection_pipeline,
    stop_detection_pipeline,
    get_pipeline_status,
    test_pi_connection,
    get_available_pi_addresses
)
from src.app.schemas.request_schema import AdminPredictionRequest, EndUserPredictionRequest
from src.app.schemas.livestream_schema import *

# traffic predictions
from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import (
  prediction_summary, prediction_detail, admin_prediction_req, user_prediction_req
)
# traffic recommendations
from src.traffic_ai.traffic_recommendation.traffic_recommendation_ai import AIRecommendation
# vehicle detection
from src.traffic_ai.vehicle_detection.shared.detection_state import latest_detections, frame_lock, latest_frame


dashboard_router = APIRouter(prefix="/api/dashboard", tags=["admin dashboard"])

# enables stateless access
# request object is a middleware from middleware.jwt_filter_middleware.py
@dashboard_router.get("/user-profile", response_model=UserSchema)
async def get_user_profile(user: User = Depends(get_current_user)): 
  if not user:
    raise ResourceNotFoundException("No user found.")
  return user


# get traffic prediction
# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# private endpoint
@dashboard_router.get("/prediction-summary")
async def get_prediction_summary() -> dict:
  return await asyncio.to_thread(prediction_summary)


# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# private endpoint
@dashboard_router.get("/prediction-detail")
async def get_prediction_detail() -> dict:
  return await asyncio.to_thread(prediction_detail)


# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# private endpoint
@dashboard_router.post("/admin-prediction-req")
async def admin_prediction_request(req: AdminPredictionRequest) -> dict: # pass the current datetime as default start
  req_dict: dict = req.model_dump()
  return await asyncio.to_thread(admin_prediction_req, req_dict) # pass req_dict as self arg of first arg


# from src/traffic_ai/traffic_forecast/traffic_prediction_json_bldr.py
# public endpoint
@dashboard_router.post("/end-user-prediction-req")
async def enduser_prediction_request(req: EndUserPredictionRequest) -> dict:
  req_dict: dict = req.model_dump()
  return await asyncio.to_thread(user_prediction_req, req_dict)


# get ai generated recommendations
# from src/traffic_ai/traffic_recommendation/traffic_recommendation_ai.py
# private endpoint
@dashboard_router.get("/admin-traffic-recommendations")
async def admin_traffic_recommendations(user: User = Depends(get_current_user)) -> dict:
  model = AIRecommendation() 
  d1 = prediction_summary()
  d2 = prediction_detail()

  await asyncio.to_thread(model.run_ai_recommendation, d1=d1, d2=d2, user_type=user.role)
  return model.reco_json


# from src/traffic_ai/traffic_recommendation/traffic_recommendation_ai.py
# public endpoint
@dashboard_router.get("/end-user-traffic-recommendations")
async def end_user_traffic_recommendations() -> dict:
  model = AIRecommendation() 
  d1 = prediction_summary()
  d2 = prediction_detail()

  await asyncio.to_thread(model.run_ai_recommendation, d1=d1, d2=d2, user_type="end_user")
  return model.reco_json


# from src/traffic_ai/traffic_recommendation/traffic_recommendation_ai.py
# private endpoint
@dashboard_router.post("/admin-traffic-req-recommendations")
async def admin_traffic_req_recommendations(
  req: AdminPredictionRequest, user: User = Depends(get_current_user)) -> str:
  model = AIRecommendation()
  req_dict: dict = req.model_dump()
  prediction_data = admin_prediction_req(req_dict)

  return await asyncio.to_thread(model.traffic_request_reco, prediction_data, user.role)


# from src/traffic_ai/traffic_recommendation/traffic_recommendation_ai.py
# public endpoint
@dashboard_router.post("/end-user-traffic-req-recommendations")
async def admin_traffic_req_recommendations(req: EndUserPredictionRequest) -> str:
  model = AIRecommendation()
  req_dict: dict = req.model_dump()
  prediction_data = user_prediction_req(req_dict)

  return await asyncio.to_thread(model.traffic_request_reco, prediction_data, "end_user")


# === LIVESTREAM CONTROL ENDPOINTS ===

@dashboard_router.post("/start-livestream", response_model=LivestreamResponse)
async def start_livestream(request: StartLivestreamRequest):
  """Start the livestream and detection pipeline"""
  try:
    # Get available Pi addresses
    available_addresses = get_available_pi_addresses()
    
    # If no camera source specified, try to auto-detect
    if not request.camera_source:
      logging.info("No camera source specified, testing available addresses...")
      
      # Test each address to find working one
      working_address = None
      for address in available_addresses:
        if await test_pi_connection(address):
          working_address = address
          logging.info(f"Found working Pi address: {address}")
          break
      
      if not working_address:
        return LivestreamResponse(
          success=False,
          message="No working Pi camera found",
          available_sources=available_addresses
        )
      
      camera_source = working_address
    else:
      camera_source = request.camera_source
    
    # Start the detection pipeline
    success, message = start_detection_pipeline(camera_source)
    
    return LivestreamResponse(
      success=success,
      message=message,
      camera_source=camera_source if success else None,
      available_sources=available_addresses
    )
      
  except Exception as e:
    logging.error(f"Error starting livestream: {e}")
    return LivestreamResponse(
      success=False,
      message=f"Failed to start livestream: {str(e)}"
    )


@dashboard_router.post("/stop-livestream", response_model=LivestreamResponse)
async def stop_livestream():
  """Stop the livestream and detection pipeline"""
  try:
    success, message = stop_detection_pipeline()
    
    return LivestreamResponse(
      success=success,
      message=message
    )
      
  except Exception as e:
    logging.error(f"Error stopping livestream: {e}")
    return LivestreamResponse(
      success=False,
      message=f"Failed to stop livestream: {str(e)}"
    )


@dashboard_router.get("/livestream-status")
async def get_livestream_status():
  """Get current livestream status"""
  try:
    status = get_pipeline_status()
    available_addresses = get_available_pi_addresses()
    
    return {
      "running": status["running"],
      "camera_source": status.get("camera_source"),
      "message": status.get("message", ""),
      "available_sources": available_addresses
    }
      
  except Exception as e:
    logging.error(f"Error getting livestream status: {e}")
    return {
      "running": False,
      "message": f"Error: {str(e)}",
      "available_sources": []
    }


@dashboard_router.get("/test-pi-connection")
async def test_pi_connection_endpoint(address_index: int = AddressIndex):
  """Test connection to a specific Pi address by index"""
  try:
    available_addresses = get_available_pi_addresses()
    
    if address_index < 0 or address_index >= len(available_addresses):
      raise HTTPException(status_code=400, detail="Invalid address index")
    
    address = available_addresses[address_index]
    is_connected = await test_pi_connection(address)
    
    return {
      "address": address,
      "connected": is_connected,
      "message": "Connected" if is_connected else "Connection failed"
    }
      
  except Exception as e:
    logging.error(f"Error testing Pi connection: {e}")
    raise HTTPException(status_code=500, detail=str(e))

# === VIDEO STREAMING ENDPOINTS ===

@dashboard_router.get("/video-feed/raw")
async def get_raw_video_feed():
  """Stream raw video feed WITHOUT AI processing"""
  try:
    logging.info("Raw video feed requested")
    
    return StreamingResponse(
      generate_raw_stream(), 
      media_type="multipart/x-mixed-replace; boundary=frame",
      headers={
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Connection": "close"
      }
    )
  except Exception as e:
    logging.error(f"Error in raw video feed endpoint: {e}")
    raise HTTPException(status_code=500, detail=f"Video feed error: {str(e)}")


@dashboard_router.get("/video-feed/processed")
async def get_processed_video_feed():
  """Stream processed video feed WITH AI annotations"""
  try:
    logging.info("Processed video feed requested")
    
    return StreamingResponse(
      generate_processed_stream(), 
      media_type="multipart/x-mixed-replace; boundary=frame",
      headers={
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache", 
        "Expires": "0",
        "Connection": "close"
      }
    )
  except Exception as e:
    logging.error(f"Error in processed video feed endpoint: {e}")
    raise HTTPException(status_code=500, detail=f"Video feed error: {str(e)}")


@dashboard_router.get("/video-feed")
async def get_video_feed():
  """Default video feed (raw for overlay compatibility)"""
  return await get_raw_video_feed()


# === DETECTION DATA ENDPOINTS ===

@dashboard_router.get("/detection-data")
def get_detection_data():
  """Get current detection data"""
  try:
    detections = get_current_detections()
    
    logging.debug(f"Returning {len(detections)} detections")
    
    return {"objects": detections}
      
  except Exception as e:
    logging.error(f"Error in detection data endpoint: {e}")
    return {"objects": []}


@dashboard_router.get("/stats")
def get_detection_stats():
  """Get detection statistics"""
  try:
    from src.traffic_ai.vehicle_detection.vehicle_counter import get_pipeline
    
    pipeline = get_pipeline()
    if pipeline is None:
      return {
        "total_count": 0,
        "vehicle_counts": {},
        "status": "stopped"
      }
    
    return {
      "total_count": len(pipeline.total_count),
      "vehicle_counts": pipeline.vehicle_class_counts,
      "status": "running" if pipeline.running else "stopped"
    }
        
  except Exception as e:
    logging.error(f"Error in stats endpoint: {e}")
    return {
      "total_count": 0,
      "vehicle_counts": {},
      "status": "error"
    }