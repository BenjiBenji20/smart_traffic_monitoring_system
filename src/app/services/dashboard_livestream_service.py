import time
import math
import cv2
import numpy as np
import threading
import logging
import asyncio
import aiohttp
import json
from typing import List, Tuple, Optional, Set
from fastapi import WebSocket

from src.traffic_ai.vehicle_detection.vehicle_counter import (
    get_pipeline, 
    start_optimized_detection,
    set_detection_mode,
    OptimizedDetectionPipeline
)
from src.app.core.settings import settings

# Global pipeline control
_pipeline_thread: Optional[threading.Thread] = None
_pipeline_stop_event = threading.Event()


# ===== WEBSOCKET BROADCAST MANAGER =====

class DetectionBroadcaster:
    """Manages WebSocket connections and broadcasts detection updates"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.broadcast_task = None
        self.is_running = False
        
    async def register(self, websocket: WebSocket):
        """Register a new WebSocket connection"""
        self.active_connections.add(websocket)
        logging.info(f"WebSocket client registered. Total clients: {len(self.active_connections)}")
        
        # Start broadcast task if not already running
        if not self.is_running:
            await self.start_broadcast()
    
    async def unregister(self, websocket: WebSocket):
        """Unregister a WebSocket connection"""
        self.active_connections.discard(websocket)
        logging.info(f"WebSocket client unregistered. Total clients: {len(self.active_connections)}")
        
        # Stop broadcast task if no clients connected
        if len(self.active_connections) == 0:
            await self.stop_broadcast()
    
    async def broadcast(self, data: dict):
        """Broadcast data to all connected clients"""
        if not self.active_connections:
            return
        
        # Convert data to JSON
        try:
            message = json.dumps(data)
        except Exception as e:
            logging.error(f"Error serializing broadcast data: {e}")
            return
        
        # Send to all clients
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logging.warning(f"Error sending to client: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            await self.unregister(connection)
    
    async def start_broadcast(self):
        """Start the broadcast task"""
        if self.is_running:
            return
        
        self.is_running = True
        self.broadcast_task = asyncio.create_task(self._broadcast_loop())
        logging.info("Detection broadcast task started")
    
    async def stop_broadcast(self):
        """Stop the broadcast task"""
        self.is_running = False
        if self.broadcast_task:
            self.broadcast_task.cancel()
            try:
                await self.broadcast_task
            except asyncio.CancelledError:
                pass
        logging.info("Detection broadcast task stopped")
    
    async def _broadcast_loop(self):
        """Main broadcast loop - runs continuously and sends updates"""
        try:
            while self.is_running and self.active_connections:
                try:
                    # Get current pipeline data
                    pipeline = get_pipeline()
                    
                    if pipeline and pipeline.running:
                        # Collect detection data
                        detections = get_current_detections()
                        stats = {
                            "total_count": pipeline.get_persistent_total_count(),
                            "vehicle_counts": pipeline.vehicle_class_counts,
                            "status": "running"
                        }
                    else:
                        detections = []
                        stats = {
                            "total_count": 0,
                            "vehicle_counts": {},
                            "status": "stopped"
                        }
                    
                    # Create broadcast message
                    data = {
                        "type": "detection_update",
                        "timestamp": time.time(),
                        "data": {
                            "detections": detections,
                            "stats": stats
                        }
                    }
                    
                    # Broadcast to all connected clients
                    await self.broadcast(data)
                    
                    # Send updates every 100ms (10 FPS)
                    await asyncio.sleep(0.1)
                    
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logging.error(f"Error in broadcast loop: {e}")
                    await asyncio.sleep(0.1)
        
        finally:
            self.is_running = False
            logging.info("Broadcast loop ended")


# Create global broadcaster instance
broadcast_detection_updates = DetectionBroadcaster()

def generate_raw_stream():
  """Generate raw video stream from the pipeline"""
  while True:
    pipeline = get_pipeline()
    if pipeline is None or not pipeline.running:
      placeholder = np.zeros((270, 480, 3), dtype=np.uint8)
      cv2.putText(placeholder, "Livestream Stopped", (120, 120), 
                  cv2.FONT_HERSHEY_SIMPLEX, 1, (128, 128, 128), 2)
      cv2.putText(placeholder, "Click Start to begin", (110, 160), 
                  cv2.FONT_HERSHEY_SIMPLEX, 0.8, (128, 128, 128), 2)
      frame = placeholder
    else:
      frame = pipeline.get_raw_frame()
      if frame is None:
        error_frame = np.zeros((270, 480, 3), dtype=np.uint8)
        cv2.putText(error_frame, "Camera Error", (150, 135), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        frame = error_frame
      
    _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    frame_bytes = jpeg.tobytes()
    
    yield (b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    time.sleep(0.033)


def generate_processed_stream():
  """Generate processed video stream with AI annotations"""
  while True:
    pipeline = get_pipeline()
    if pipeline is None or not pipeline.running:
      placeholder = np.zeros((270, 480, 3), dtype=np.uint8)
      cv2.putText(placeholder, "AI Detection Stopped", (100, 120), 
                  cv2.FONT_HERSHEY_SIMPLEX, 1, (128, 128, 128), 2)
      cv2.putText(placeholder, "Start livestream first", (110, 160), 
                  cv2.FONT_HERSHEY_SIMPLEX, 0.8, (128, 128, 128), 2)
      frame = placeholder
    else:
      frame = pipeline.get_processed_frame()
      if frame is None:
          loading_frame = np.zeros((270, 480, 3), dtype=np.uint8)
          cv2.putText(loading_frame, "Processing...", (150, 135), 
                      cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)
          frame = loading_frame
    
    _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    frame_bytes = jpeg.tobytes()
    
    yield (b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    time.sleep(0.033)


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
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
      async with session.get(address) as response:
        if response.status == 200:
          chunk = await response.content.read(1024)
          return len(chunk) > 0
    return False
  except Exception as e:
    logging.warning(f"Pi connection test failed for {address}: {e}")
    return False


def start_detection_pipeline(camera_source: str, detection_mode: str = "raw") -> Tuple[bool, str]:
  """Start the detection pipeline with specified camera source and mode"""
  global _pipeline_thread, _pipeline_stop_event
  
  try:
    pipeline = get_pipeline()
    if pipeline and pipeline.running:
      return False, "Pipeline is already running. Stop it first."
    
    if _pipeline_thread and _pipeline_thread.is_alive():
      _pipeline_stop_event.set()
      _pipeline_thread.join(timeout=5)
    
    _pipeline_stop_event.clear()
    
    _pipeline_thread = threading.Thread(
      target=start_optimized_detection,
      args=(camera_source, detection_mode),
      daemon=True
    )
    _pipeline_thread.start()
    
    time.sleep(2)
    
    pipeline = get_pipeline()
    if pipeline and pipeline.running:
      logging.info(f"Detection pipeline started with source: {camera_source}, mode: {detection_mode}")
      return True, f"Livestream started successfully (mode: {detection_mode})"
    else:
      return False, "Failed to initialize detection pipeline"
      
  except Exception as e:
    logging.error(f"Error starting detection pipeline: {e}")
    return False, f"Failed to start pipeline: {str(e)}"


def switch_detection_mode(mode: str) -> Tuple[bool, str]:
  """Switch detection mode without restarting pipeline"""
  try:
    from src.traffic_ai.vehicle_detection.vehicle_counter import set_detection_mode
    
    pipeline = get_pipeline()
    if pipeline is None:
      return False, "No pipeline is currently running"
    
    if set_detection_mode(mode):
      logging.info(f"Detection mode switched to: {mode}")
      return True, f"Detection mode switched to: {mode}"
    else:
      return False, "Invalid detection mode"
      
  except Exception as e:
    logging.error(f"Error switching detection mode: {e}")
    return False, f"Failed to switch mode: {str(e)}"


def stop_detection_pipeline() -> Tuple[bool, str]:
  """Stop the detection pipeline"""
  global _pipeline_thread, _pipeline_stop_event
  
  try:
    pipeline = get_pipeline()
    
    if pipeline is None:
      return False, "No pipeline is currently running"
    
    pipeline.stop()
    _pipeline_stop_event.set()
    
    if _pipeline_thread and _pipeline_thread.is_alive():
      _pipeline_thread.join(timeout=10)
    
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
      "detection_mode": getattr(pipeline, 'detection_mode', 'unknown'),
      "message": "Pipeline running" if pipeline.running else "Pipeline stopped"
    }
      
  except Exception as e:
    logging.error(f"Error getting pipeline status: {e}")
    return {
      "running": False,
      "message": f"Error: {str(e)}"
    }
    

def change_limit_angle_service(degree_angle: int, side: str) -> dict:
  """
  Receives limit angle: 30, 35, 45, 60, or 90 degrees.
  Calculates new line limits based on the side ('left' or 'right').
  """
  try:
    pipeline = get_pipeline()
    
    if pipeline is None:
      return {
        "limit": [400, 135, 80, 135],
        "message" : "Detection pipeline not available"
      }
    
    if degree_angle not in [30, 35, 45, 60, 90]:
      pipeline.change_limit_angle([400, 135, 80, 135])
      return {
        "limit": [400, 135, 80, 135],
        "message" : "Degree angle set to default"
      }

    # Frame dimensions
    width, height = 480, 270
    cx, cy = width // 2, height // 2
    line_length = 320 / 2  # half of the horizontal span (160)

    # Handle 90° case: vertical line through center
    if degree_angle == 90:
      pipeline.change_limit_angle([cx, 0, cx, height])
      return {
        "limit": [cx, 0, cx, height],
        "message" : f"Angle set to {degree_angle}° (vertical)"
      }

    # Convert angle to radians
    angle_rad = math.radians(degree_angle)

    dx = int(line_length * math.cos(angle_rad))
    dy = int(line_length * math.sin(angle_rad))

    if side.lower() == "right":
      # Slant up-right
      x1, y1 = cx - dx, cy - dy
      x2, y2 = cx + dx, cy + dy
    elif side.lower() == "left":
      # Slant up-left
      x1, y1 = cx + dx, cy - dy
      x2, y2 = cx - dx, cy + dy
    else:
      pipeline.change_limit_angle([400, 135, 80, 135])
      return {
        "limit": [400, 135, 80, 135],
        "message" : "Invalid side. Fall back to horizontal"
      }
      
    # change the limit in detection pipeline
    pipeline.change_limit_angle([x1, y1, x2, y2])

    return {
      "limit": [x1, y1, x2, y2],
      "message": f"Angle set to {degree_angle}° ({side})"
    }
  except Exception as e:
    logging.error(f"Error changing virtual line limit: {e}")
    return {
      "limit": [400, 135, 80, 135], 
      "message": f"Error: {str(e)}"
    }