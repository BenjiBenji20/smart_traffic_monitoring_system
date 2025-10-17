import logging
import requests.exceptions
from ultralytics import YOLO
import math
from src.traffic_ai.vehicle_detection.sort import *
from src.traffic_ai.vehicle_detection.shared import detection_state
import cv2
import cvzone
import numpy as np
import time
from datetime import datetime
import pandas as pd
import firebase_admin
from firebase_admin import credentials, db
import threading
import queue
import io

# Firebase setup (only initialize if not already done)
if not firebase_admin._apps:
    cred = credentials.Certificate(r"C:\Users\imper\Documents\capstone-project-v2\configs\traffic-logs-firebase-admin-sdk.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://capstone-traffic-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app/'
    })

today = pd.to_datetime(datetime.now()).date()
previous_class_counts = {}
firebase_queue = queue.Queue()

def firebase_worker():
    """Firebase worker thread"""
    while True:
        try:
            task = firebase_queue.get(timeout=5)
            if task is None:
                firebase_queue.task_done()
                break

            path, action, data = task
            ref = db.reference(path)
            if action == 'push':
                ref.push(data)
            elif action == 'set':
                ref.set(data)
            elif action == 'update':
                ref.update(data)

            print(f"Firebase: {action} at {path}")
            firebase_queue.task_done()
        except queue.Empty:
            continue
        except Exception as e:
            logging.error(f"Firebase error: {e}")
            firebase_queue.task_done()

class OptimizedDetectionPipeline:
    def __init__(self, camera_source, detection_mode="processed"):
        self.camera_source = camera_source
        self.detection_mode = detection_mode
        self.cap = None
        self.model = YOLO("src/traffic_ai/vehicle_detection/image-weights/vehicle_detection_model_v2n.onnx", task='detect')
        self.class_names = []
        self.tracker = None
        self.running = False
        self.initialized = False
        
        # Vehicle color mapping (BGR format for OpenCV)
        self.vehicle_colors = {
            'car': (255, 255, 0),          # Cyan
            'truck': (128, 0, 128),        # Purple
            'jeepney': (0, 165, 255),      # Orange
            'tricycle': (139, 69, 19),     # Navy blue (darker)
            'motorcycle': (203, 192, 255), # Pink/Light purple
            'bicycle': (0, 255, 255),      # Yellow
        }
        
        # Detection state
        self.raw_frame = None
        self.processed_frame = None
        self.current_detections = []
        self.frame_lock = threading.Lock()
        
        # Traffic monitoring
        self.limits = [400, 135, 80, 135]
        self.time_track = {}
        self.current_ids = set()
        self.total_count = []
        self.vehicle_class_counts = {}
        self.vehicle_data = {}
        self.crossed_vehicles = set()
        
        # Performance optimization
        self.frame_skip = 2
        self.frame_count = 0
        
        # Firebase worker thread
        self.firebase_thread = None
        
        
    def get_vehicle_color(self, vehicle_class):
        """Get color for vehicle class"""
        return self.vehicle_colors.get(vehicle_class.lower(), (128, 128, 128))  # Default gray
        
        
    def load_existing_counts_from_firebase(self):
        """Load existing vehicle counts from Firebase for today"""
        try:
            ref = db.reference(f"/detected_vehicle/{today}/vehicle_class_count")
            existing_counts = ref.get()
            
            if existing_counts:
                print(f"Loading existing counts from Firebase: {existing_counts}")
                for vehicle_type, count in existing_counts.items():
                    if vehicle_type in self.vehicle_class_counts:
                        self.vehicle_class_counts[vehicle_type] = count
                    else:
                        self.vehicle_class_counts[vehicle_type] = count
                
                total_from_firebase = sum(existing_counts.values())
                print(f"Restored counts - Total: {total_from_firebase}, Details: {self.vehicle_class_counts}")
            else:
                print("No existing counts found in Firebase for today, starting fresh")
                
        except Exception as e:
            print(f"Error loading existing counts from Firebase: {e}")
            print("Starting with zero counts")


    def get_persistent_total_count(self):
        """Get total count including previous Firebase data"""
        session_count = len(self.total_count)
        firebase_base_count = sum(self.vehicle_class_counts.values()) - session_count
        return firebase_base_count + session_count


    def set_detection_mode(self, mode: str):
        """Set detection mode: 'raw' or 'processed'"""
        if mode in ["raw", "processed"]:
            self.detection_mode = mode
            print(f"🔄 Detection mode changed to: {mode}")
            if mode == "raw":
                print("AI processing DISABLED - No vehicle counting or Firebase updates")
            else:
                print("AI processing ENABLED - Vehicle counting and Firebase updates active")
            return True
        return False
    

    def initialize(self):
        """Initialize all components"""
        try:
            print(f"Initializing optimized detection pipeline with source: {self.camera_source}")
            
            # Initialize camera
            self.cap = cv2.VideoCapture(self.camera_source)
            if not self.cap.isOpened():
                raise Exception(f"Cannot open camera: {self.camera_source}")
            
            # Optimize camera settings
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            # Get class names directly from the model
            self.class_names = list(self.model.names.values())
            print(f"✅ Model loaded with classes: {self.class_names}")
            
            # Initialize counts for all vehicle types from the model
            self.vehicle_class_counts = {cls: 0 for cls in self.class_names}
            print(f"Initialized vehicle types: {list(self.vehicle_class_counts.keys())}")
            
            self.load_existing_counts_from_firebase()

            # Initialize tracker
            self.tracker = Sort(max_age=30, min_hits=2, iou_threshold=0.25)
            
            # Start Firebase worker thread
            self.firebase_thread = threading.Thread(target=firebase_worker, daemon=True)
            self.firebase_thread.start()
            
            self.initialized = True
            print("Pipeline initialized successfully")
            return True
            
        except Exception as e:
            print(f"Initialization error: {e}")
            self.initialized = False
            return False
    
    
    def check_date_change(self):
        """Check if date has changed and reset counts if needed"""
        global today
        current_date = pd.to_datetime(datetime.now()).date()
        
        if current_date != today:
            print(f"📅 Date changed from {today} to {current_date}")
            today = current_date
            self.vehicle_class_counts = {cls: 0 for cls in self.class_names}
            self.total_count = []
            self.crossed_vehicles.clear()
            print("🔄 Counts reset for new day")
            return True
        return False


    def change_limit_angle(self, new_limits: list[int]) -> bool:
        """Change limit angle based on user input"""
        if not len(new_limits) == 4:
            return False
        
        self.limits = new_limits
        return True
    
    
    def point_to_line_distance(self, px: int, py: int) -> float:
        """
        Calculate perpendicular distance from point (px, py) to the detection line.
        Uses the formula: |Ax + By + C| / sqrt(A² + B²)
        """
        x1, y1, x2, y2 = self.limits
        
        # Handle vertical line (90 degrees)
        if x1 == x2:
            return abs(px - x1)
        
        # Handle horizontal line (default)
        if y1 == y2:
            return abs(py - y1)
        
        # General case: Calculate line equation Ax + By + C = 0
        # From two points: (y2-y1)x - (x2-x1)y + (x2-x1)y1 - (y2-y1)x1 = 0
        A = y2 - y1
        B = x1 - x2
        C = (x2 - x1) * y1 - (y2 - y1) * x1
        
        # Distance formula
        distance = abs(A * px + B * py + C) / math.sqrt(A * A + B * B)
        return distance


    def is_point_on_line_segment(self, px: int, py: int, threshold: int = 20) -> bool:
        """
        Check if point (px, py) is near the line segment AND within bounds.
        
        Args:
            px, py: Point coordinates (vehicle center)
            threshold: Maximum distance from line to consider "crossing" (pixels)
        
        Returns:
            True if point is near the line and within segment bounds
        """
        x1, y1, x2, y2 = self.limits
        
        # Step 1: Check perpendicular distance to line
        distance = self.point_to_line_distance(px, py)
        if distance > threshold:
            return False
        
        # Step 2: Check if point is within the bounding box of line segment
        min_x = min(x1, x2) - threshold
        max_x = max(x1, x2) + threshold
        min_y = min(y1, y2) - threshold
        max_y = max(y1, y2) + threshold
        
        if not (min_x <= px <= max_x and min_y <= py <= max_y):
            return False
        
        return True
    

    def process_frame(self):
        """Process a single frame with detection and tracking"""
        if not self.running or not self.initialized:
            return False
            
        self.check_date_change()

        ret, frame = self.cap.read()
        if not ret:
            return False
        
        self.frame_count += 1
        
        # Resize frame
        frame = cv2.resize(frame, (480, 270))
        
        # Store raw frame
        with self.frame_lock:
            self.raw_frame = frame.copy()
        
        # Skip AI processing in raw mode
        if self.detection_mode == "raw":
            with detection_state.frame_lock:
                detection_state.latest_frame = self.raw_frame.copy()
                detection_state.latest_detections = []
            
            with self.frame_lock:
                self.processed_frame = frame.copy()
                self.current_detections = []
            
            time.sleep(0.016)
            return True

        # Skip frames for performance
        if self.frame_count % self.frame_skip != 0:
            return True
        
        try:
            # Run YOLO without class filtering
            results = self.model.predict(
                frame, 
                verbose=False, 
                conf=0.25
            )
            
            # Process detections
            detections = np.empty((0, 5))
            frame_detections = []
            detected_objects = {}
            
            for r in results:
                if r.boxes is not None:
                    for box in r.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        w, h = x2 - x1, y2 - y1
                        cls = int(box.cls[0])
                        conf = round(float(box.conf[0]), 2)
                        
                        # Get class name directly from model
                        class_name = self.model.names[cls]
                        
                        frame_detections.append({
                            "label": class_name,
                            "confidence": conf,
                            "bbox": [x1, y1, x2, y2]
                        })
                        
                        # For tracking
                        current_array = np.array([x1, y1, x2, y2, conf])
                        detections = np.vstack((detections, current_array))
                        detected_objects[(x1, y1, x2, y2)] = class_name
            
            # Update tracking
            tracked_objects = self.tracker.update(detections)
            
            # Draw tracked objects FIRST, then detections overlay
            # This way counted vehicles (green) won't be covered by detection boxes
            
            # Draw counting line
            cv2.line(frame, (self.limits[0], self.limits[1]), 
                    (self.limits[2], self.limits[3]), (0, 0, 255), 2)
            
            # STEP 1: Draw all tracked objects first
            self.current_ids.clear()
            for track in tracked_objects:
                x1, y1, x2, y2, track_id = map(int, track)
                w, h = x2 - x1, y2 - y1
                cx, cy = x1 + w // 2, y1 + h // 2
                
                self.current_ids.add(track_id)
                
                # Check line crossing
                if (self.is_point_on_line_segment(cx, cy, threshold=25) and 
                    track_id not in self.crossed_vehicles):
                    
                    self.handle_vehicle_crossing(track_id, detected_objects, frame_detections, cx, cy)
                
                # Draw tracking boxes based on status
                if track_id in self.crossed_vehicles:
                    # COUNTED vehicles - Light Green
                    vehicle_class = self.vehicle_data.get(track_id, {}).get("class", "Unknown")
                    cvzone.cornerRect(frame, (x1, y1, w, h), l=9, colorR=(144, 238, 144), rt=2)  # Light green
                    cv2.putText(frame, f"COUNTED: {vehicle_class} - ID:{track_id}", 
                                    (max(0, x1), max(35, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 
                                    0.5, (144, 238, 144), 1)
            
            # STEP 2: Draw initial detections on top (these are not yet tracked/counted)
            # Only draw if they don't overlap with tracked objects
            for r in results:
                if r.boxes is not None:
                    for box in r.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        w, h = x2 - x1, y2 - y1
                        cls = int(box.cls[0])
                        conf = round(float(box.conf[0]), 2)
                        class_name = self.model.names[cls]
                        
                        # Check if this detection is already being tracked
                        is_tracked = False
                        for track in tracked_objects:
                            tx1, ty1, tx2, ty2, _ = map(int, track)
                            # If detection overlaps significantly with tracked object, skip drawing
                            if (abs(x1 - tx1) < 30 and abs(y1 - ty1) < 30 and 
                                abs(x2 - tx2) < 30 and abs(y2 - ty2) < 30):
                                is_tracked = True
                                break
                        
                        # Only draw if not tracked yet (new detections)
                        if not is_tracked:
                            vehicle_color = self.get_vehicle_color(class_name)
                            cvzone.cornerRect(frame, (x1, y1, w, h), l=6, rt=1, colorR=vehicle_color)
                            cv2.putText(frame, f"{class_name}", (max(0, x1), max(35, y1 - 5)), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5,vehicle_color, 1) 
            
            # Handle vehicle exits
            self.handle_vehicle_exits()
            
            # Update shared state
            tracked_detections = []
            for det in frame_detections:
                for track in tracked_objects:
                    x1, y1, x2, y2, track_id = map(int, track)
                    det_x1, det_y1, det_x2, det_y2 = det["bbox"]
                    
                    if (abs(det_x1 - x1) < 20 and abs(det_y1 - y1) < 20 and 
                        abs(det_x2 - x2) < 20 and abs(det_y2 - y2) < 20):
                        tracked_detections.append(det)
                        break
            
            with detection_state.frame_lock:
                detection_state.latest_frame = self.raw_frame.copy()
                detection_state.latest_detections = tracked_detections.copy()
            
            with self.frame_lock:
                self.processed_frame = frame.copy()
                self.current_detections = tracked_detections.copy()
            
            return True
            
        except Exception as e:
            print(f"Frame processing error: {e}")
            return True
    

    def handle_vehicle_crossing(self, track_id, detected_objects, frame_detections, cx, cy):
        """Handle vehicle crossing the counting line"""
        self.crossed_vehicles.add(track_id)
        
        current_time = time.strftime("%H:%M:%S")
        self.time_track[track_id] = {"time_in": current_time, "time_out": None}
        
        # Determine vehicle class from closest detection
        vehicle_class = "car"
        min_distance = float('inf')
        
        for det_box, det_class in detected_objects.items():
            det_cx = (det_box[0] + det_box[2]) / 2
            det_cy = (det_box[1] + det_box[3]) / 2
            distance = ((cx - det_cx) ** 2 + (cy - det_cy) ** 2) ** 0.5
            if distance < min_distance:
                min_distance = distance
                vehicle_class = det_class
        
        # Get confidence
        conf = 0.0
        for det in frame_detections:
            if det["label"] == vehicle_class:
                conf = det["confidence"]
                break
        
        # Store vehicle data
        self.vehicle_data[track_id] = {
            "vehicle_id": track_id,
            "class": vehicle_class,
            "confidence_score": conf,
            "time_in": current_time,
            "time_out": None,
            "speed_ms": None,
            "date": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Update counts
        if track_id not in self.total_count:
            self.total_count.append(track_id)
            
        if vehicle_class in self.vehicle_class_counts:
            self.vehicle_class_counts[vehicle_class] += 1
        else:
            self.vehicle_class_counts[vehicle_class] = 1

        total_persistent_count = self.get_persistent_total_count()
        print(f"✅ VEHICLE COUNTED: {track_id} ({vehicle_class}) - Session: {len(self.total_count)}, Total: {total_persistent_count}")
        print(f"Current counts: {self.vehicle_class_counts}")

        # Update Firebase
        firebase_queue.put((f"/detected_vehicle/{today}/vehicle_class_count", 
                        'update', {vehicle_class: self.vehicle_class_counts[vehicle_class]}))
    

    def handle_vehicle_exits(self):
        """Handle vehicles exiting the frame"""
        all_tracked_ids = set(self.time_track.keys())
        exited_ids = all_tracked_ids - self.current_ids
        
        for ex_id in exited_ids:
            if self.time_track[ex_id]["time_out"] is None:
                self.time_track[ex_id]["time_out"] = time.strftime("%H:%M:%S")
                
                try:
                    t1 = pd.Timedelta(self.time_track[ex_id]['time_out'])
                    t2 = pd.Timedelta(self.time_track[ex_id]['time_in'])
                    travel_time = int((t1-t2).total_seconds())
                    speed_ms = round(100 / travel_time, 2) if travel_time > 0 else 0.0
                except:
                    speed_ms = 0.0
                
                if ex_id in self.vehicle_data and ex_id in self.crossed_vehicles:
                    self.vehicle_data[ex_id]["time_out"] = self.time_track[ex_id]['time_out']
                    self.vehicle_data[ex_id]["speed_ms"] = speed_ms
                    
                    firebase_queue.put((f"/detected_vehicle/{today}/individual_vehicle", 
                                      'push', self.vehicle_data[ex_id]))
                    
                    print(f"🚗 Vehicle {ex_id} completed: {self.vehicle_data[ex_id]}")
                    
                    del self.time_track[ex_id]
                    del self.vehicle_data[ex_id]
                    self.crossed_vehicles.discard(ex_id)
    

    def get_raw_frame(self):
        """Get raw frame for streaming"""
        with self.frame_lock:
            return self.raw_frame.copy() if self.raw_frame is not None else None
    

    def get_processed_frame(self):
        """Get processed frame with annotations"""
        with self.frame_lock:
            return self.processed_frame.copy() if self.processed_frame is not None else None
    

    def get_detections(self):
        """Get current detections"""
        with self.frame_lock:
            return self.current_detections.copy()
    

    def run(self):
        """Main processing loop"""
        if not self.initialize():
            print("Failed to initialize pipeline")
            return
        
        self.running = True
        print("Starting optimized detection loop...")
        print("🚨 DETECTION MODE: Vehicles will only be counted when they cross the virtual line!")
        
        while self.running:
            try:
                if not self.process_frame():
                    print("Camera disconnected, attempting reconnection...")
                    if self.cap:
                        self.cap.release()
                    time.sleep(2)
                    self.cap = cv2.VideoCapture(self.camera_source)
                    continue
                
                time.sleep(0.033)
            except Exception as e:
                if self.running:
                    print(f"Processing error: {e}")
                    time.sleep(1)
        
        print("Cleaning up pipeline...")
        if self.cap:
            self.cap.release()
        
        firebase_queue.put(None)
        
        print("Pipeline cleanup complete")
    

    def stop(self):
        """Stop the pipeline"""
        print("Stopping detection pipeline...")
        self.running = False

# Global pipeline instance
pipeline = None
pipeline_lock = threading.Lock()

def start_optimized_detection(camera_source, detection_mode="processed"):
    """Start the optimized detection pipeline"""
    global pipeline
    
    with pipeline_lock:
        if pipeline and pipeline.running:
            pipeline.stop()
            time.sleep(1)
        
        pipeline = OptimizedDetectionPipeline(camera_source, detection_mode)
        
    pipeline.run()


def get_pipeline():
    """Get the global pipeline instance"""
    with pipeline_lock:
        return pipeline


def stop_pipeline():
    """Stop the current pipeline"""
    global pipeline
    
    with pipeline_lock:
        if pipeline:
            pipeline.stop()
            return True
        return False
    
    
def set_detection_mode(mode: str):
    """Set detection mode for current pipeline"""
    global pipeline
    
    with pipeline_lock:
        if pipeline:
            return pipeline.set_detection_mode(mode)
        return False
    
    
def change_limit_angle(new_limits: list[int]) -> bool:
    """Service function call to set a new limit"""
    global pipeline
    
    with pipeline_lock:
        if pipeline and pipeline.running:
            return pipeline.change_limit_angle(new_limits)
        return False