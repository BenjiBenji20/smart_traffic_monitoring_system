# src/app/services/dashboard_service.py
import time
import cv2
import numpy as np
import threading
import logging
import asyncio
import aiohttp
from typing import List, Tuple, Optional

from src.traffic_ai.vehicle_detection.vehicle_counter import (
    get_pipeline, 
    start_optimized_detection,
    OptimizedDetectionPipeline
)
from src.app.core.settings import settings

# Global pipeline control
_pipeline_thread: Optional[threading.Thread] = None
_pipeline_stop_event = threading.Event()

def generate_raw_stream():
  """Generate raw video stream from the pipeline"""
  while True:
    pipeline = get_pipeline()
    if pipeline is None or not pipeline.running:
      # No pipeline running, send placeholder
      placeholder = np.zeros((270, 480, 3), dtype=np.uint8)
      cv2.putText(placeholder, "Livestream Stopped", (120, 120), 
                  cv2.FONT_HERSHEY_SIMPLEX, 1, (128, 128, 128), 2)
      cv2.putText(placeholder, "Click Start to begin", (110, 160), 
                  cv2.FONT_HERSHEY_SIMPLEX, 0.8, (128, 128, 128), 2)
      frame = placeholder
    else:
      # Get raw frame from pipeline
      frame = pipeline.get_raw_frame()
      if frame is None:
        # Camera disconnected, send error frame
        error_frame = np.zeros((270, 480, 3), dtype=np.uint8)
        cv2.putText(error_frame, "Camera Error", (150, 135), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        frame = error_frame
      
    # Encode frame
    _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    frame_bytes = jpeg.tobytes()
    
    # Yield MJPEG frame
    yield (b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    time.sleep(0.033)  # ~30fps

def generate_processed_stream():
  """Generate processed video stream with AI annotations"""
  while True:
    pipeline = get_pipeline()
    if pipeline is None or not pipeline.running:
      # No pipeline running, send placeholder
      placeholder = np.zeros((270, 480, 3), dtype=np.uint8)
      cv2.putText(placeholder, "AI Detection Stopped", (100, 120), 
                  cv2.FONT_HERSHEY_SIMPLEX, 1, (128, 128, 128), 2)
      cv2.putText(placeholder, "Start livestream first", (110, 160), 
                  cv2.FONT_HERSHEY_SIMPLEX, 0.8, (128, 128, 128), 2)
      frame = placeholder
    else:
      # Get processed frame from pipeline
      frame = pipeline.get_processed_frame()
      if frame is None:
          # No processed frame yet
          loading_frame = np.zeros((270, 480, 3), dtype=np.uint8)
          cv2.putText(loading_frame, "Processing...", (150, 135), 
                      cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)
          frame = loading_frame
    
    # Encode frame
    _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    frame_bytes = jpeg.tobytes()
    
    # Yield MJPEG frame
    yield (b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    time.sleep(0.033)  # ~30fps

def get_current_detections():
  """Get current detections from the pipeline"""
  pipeline = get_pipeline()
  if pipeline is None or not pipeline.running:
    return []
  
  return pipeline.get_detections()

def get_available_pi_addresses() -> List[str]:
  """Get list of available Pi addresses from settings"""
  return settings.get_pi_addresses()

async def test_pi_connection(address: str, timeout: int = 5) -> bool:
  """Test connection to a Pi camera address"""
  try:
    # Try to connect to the Pi camera stream
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
      async with session.get(address) as response:
        if response.status == 200:
          # Try to read a small chunk to ensure it's actually streaming
          chunk = await response.content.read(1024)
          return len(chunk) > 0
    return False
  except Exception as e:
    logging.warning(f"Pi connection test failed for {address}: {e}")
    return False

def start_detection_pipeline(camera_source: str) -> Tuple[bool, str]:
  """Start the detection pipeline with specified camera source"""
  global _pipeline_thread, _pipeline_stop_event
  
  try:
    # Check if pipeline is already running
    pipeline = get_pipeline()
    if pipeline and pipeline.running:
      return False, "Pipeline is already running. Stop it first."
    
    # Stop any existing thread
    if _pipeline_thread and _pipeline_thread.is_alive():
      _pipeline_stop_event.set()
      _pipeline_thread.join(timeout=5)
    
    # Reset stop event
    _pipeline_stop_event.clear()
    
    # Start new detection thread
    _pipeline_thread = threading.Thread(
      target=start_optimized_detection,
      args=(camera_source,),
      daemon=True
    )
    _pipeline_thread.start()
    
    # Give the pipeline time to initialize
    time.sleep(2)
    
    # Verify pipeline started
    pipeline = get_pipeline()
    if pipeline and pipeline.running:
      logging.info(f"Detection pipeline started successfully with source: {camera_source}")
      return True, f"Livestream started successfully with source: {camera_source}"
    else:
      return False, "Failed to initialize detection pipeline"
      
  except Exception as e:
    logging.error(f"Error starting detection pipeline: {e}")
    return False, f"Failed to start pipeline: {str(e)}"

def stop_detection_pipeline() -> Tuple[bool, str]:
  """Stop the detection pipeline"""
  global _pipeline_thread, _pipeline_stop_event
  
  try:
    # Get current pipeline
    pipeline = get_pipeline()
    
    if pipeline is None:
      return False, "No pipeline is currently running"
    
    # Stop the pipeline
    pipeline.stop()
    
    # Signal thread to stop
    _pipeline_stop_event.set()
    
    # Wait for thread to finish
    if _pipeline_thread and _pipeline_thread.is_alive():
      _pipeline_thread.join(timeout=10)
    
    # Reset thread reference
    _pipeline_thread = None
    
    logging.info("Detection pipeline stopped successfully")
    return True, "Livestream stopped successfully"
      
  except Exception as e:
    logging.error(f"Error stopping detection pipeline: {e}")
    return False, f"Failed to stop pipeline: {str(e)}"

def get_pipeline_status() -> dict:
  """Get current pipeline status"""
  try:
    pipeline = get_pipeline()
    
    if pipeline is None:
      return {
        "running": False,
        "message": "Pipeline not initialized"
      }
    
    return {
      "running": pipeline.running,
      "camera_source": getattr(pipeline, 'camera_source', None),
      "message": "Pipeline running" if pipeline.running else "Pipeline stopped"
    }
      
  except Exception as e:
    logging.error(f"Error getting pipeline status: {e}")
    return {
      "running": False,
      "message": f"Error: {str(e)}"
    }