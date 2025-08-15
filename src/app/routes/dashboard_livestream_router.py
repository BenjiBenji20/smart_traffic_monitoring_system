import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from src.app.exceptions.custom_exceptions import *
from src.app.services.dashboard_livestream_service import (
    generate_raw_stream, 
    generate_processed_stream, 
    get_current_detections,
    start_detection_pipeline,
    stop_detection_pipeline,
    switch_detection_mode,
    get_pipeline_status,
    test_pi_connection,
    get_available_pi_addresses
)
from src.app.schemas.livestream_schema import *


dashboard_livestream_router = APIRouter(
    prefix="/api/dashboard/livestream",
    tags=["admin dashboard livestream"]
  )


# # === LIVESTREAM CONTROL ENDPOINTS ===

# === LIVESTREAM CONTROL ENDPOINTS ===

@dashboard_livestream_router.post("/start-livestream", response_model=LivestreamResponse)
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
    success, message = start_detection_pipeline(camera_source, "raw")
    
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


@dashboard_livestream_router.post("/stop-livestream", response_model=LivestreamResponse)
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


@dashboard_livestream_router.get("/livestream-status")
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


@dashboard_livestream_router.get("/test-pi-connection")
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

@dashboard_livestream_router.get("/video-feed/raw")
async def get_raw_video_feed():
  """Stream raw video feed WITHOUT AI processing"""
  try:
    logging.info("Raw video feed requested")

    # Automatically switch to raw mode (no Firebase updates)
    switch_detection_mode("raw")
    
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


@dashboard_livestream_router.get("/video-feed/processed")
async def get_processed_video_feed():
  """Stream processed video feed WITH AI annotations"""
  try:
    logging.info("Processed video feed requested")

    # Automatically switch to processed mode (Firebase updates enabled)
    switch_detection_mode("processed")
    
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


@dashboard_livestream_router.get("/video-feed")
async def get_video_feed():
  """Default video feed (raw for overlay compatibility)"""
  return await get_raw_video_feed()


@dashboard_livestream_router.post("/switch-detection-mode")
async def switch_mode(request: SwitchModeRequest):
  """Switch detection mode without restarting pipeline"""
  try:
    if request.mode not in ["raw", "processed"]:
      return {
        "success": False,
        "message": "Invalid mode. Use 'raw' or 'processed'"
      }
    
    success, message = switch_detection_mode(request.mode)
    
    return {
      "success": success,
      "message": message,
      "mode": request.mode if success else None
    }
      
  except Exception as e:
    logging.error(f"Error switching detection mode: {e}")
    return {
      "success": False,
      "message": f"Failed to switch mode: {str(e)}"
    }

# === DETECTION DATA ENDPOINTS ===

@dashboard_livestream_router.get("/detection-data")
def get_detection_data():
  """Get current detection data"""
  try:
    detections = get_current_detections()
    
    logging.debug(f"Returning {len(detections)} detections")
    
    return {"objects": detections}
      
  except Exception as e:
    logging.error(f"Error in detection data endpoint: {e}")
    return {"objects": []}


@dashboard_livestream_router.get("/stats")
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