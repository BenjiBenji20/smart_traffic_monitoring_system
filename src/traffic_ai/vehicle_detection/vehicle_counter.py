# src/traffic_ai/vehicle_detection/optimized_vehicle_counter.py

import logging
import requests.exceptions
from ultralytics import YOLO
from src.traffic_ai.vehicle_detection.ClassNames import ClassNames
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
    def __init__(self, camera_source):
        self.camera_source = camera_source
        self.cap = None
        self.model = None
        self.classes = None
        self.tracker = None
        self.running = False
        self.initialized = False
        
        # Detection state
        self.raw_frame = None
        self.processed_frame = None
        self.current_detections = []
        self.frame_lock = threading.Lock()
        
        # Traffic monitoring
        self.limits = [400, 135, 80, 135]  # Adjusted for 480x270 resolution
        self.time_track = {}
        self.current_ids = set()
        self.total_count = []
        self.vehicle_class_counts = {}
        self.vehicle_data = {}
        self.crossed_vehicles = set()  # Track which vehicles have crossed the line
        
        # Performance optimization
        self.frame_skip = 2  # Process every 2nd frame
        self.frame_count = 0
        
        # Firebase worker thread
        self.firebase_thread = None
        
    def initialize(self):
        """Initialize all components"""
        try:
            print(f"Initializing optimized detection pipeline with source: {self.camera_source}")
            
            # Initialize camera with better settings
            self.cap = cv2.VideoCapture(self.camera_source)
            if not self.cap.isOpened():
                raise Exception(f"Cannot open camera: {self.camera_source}")
            
            # Optimize camera settings
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            # Load YOLO model
            self.model = YOLO("src/traffic_ai/vehicle_detection/image-weights/yolo11n.onnx", task='detect')
            
            # Load classes
            self.classes = ClassNames()
            # Initialize counts for ALL vehicle types
            vehicle_types = ['car', 'truck', 'bus', 'motorbike', 'bicycle']
            self.vehicle_class_counts = {cls: 0 for cls in vehicle_types}
            
            # Initialize tracker
            self.tracker = Sort(max_age=20, min_hits=3, iou_threshold=0.3)
            
            # Start Firebase worker thread
            self.firebase_thread = threading.Thread(target=firebase_worker, daemon=True)
            self.firebase_thread.start()
            
            self.initialized = True
            print("Pipeline initialized successfully")
            print(f"Initialized vehicle types: {list(self.vehicle_class_counts.keys())}")
            return True
            
        except Exception as e:
            print(f"Initialization error: {e}")
            self.initialized = False
            return False
    
    def process_frame(self):
        """Process a single frame with detection and tracking"""
        if not self.running or not self.initialized:
            return False
            
        ret, frame = self.cap.read()
        if not ret:
            return False
        
        self.frame_count += 1
        
        # Resize frame
        frame = cv2.resize(frame, (480, 270))
        
        # Store raw frame for streaming
        with self.frame_lock:
            self.raw_frame = frame.copy()
        
        # Skip frames for performance
        if self.frame_count % self.frame_skip != 0:
            return True
        
        try:
            # Run YOLO detection
            results = self.model.predict(
                frame, 
                classes=self.classes.classified_vehicle(), 
                verbose=False, 
                conf=0.3
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
                        
                        det_obj = self.classes.class_names[cls]
                        
                        # Map YOLO classes to our vehicle types
                        vehicle_type = self.map_yolo_to_vehicle_type(det_obj)
                        
                        # Only show detections in frontend (not count them yet)
                        frame_detections.append({
                            "label": vehicle_type,
                            "confidence": conf,
                            "bbox": [x1, y1, x2, y2]
                        })
                        
                        # For tracking
                        current_array = np.array([x1, y1, x2, y2, conf])
                        detections = np.vstack((detections, current_array))
                        detected_objects[(x1, y1, x2, y2)] = vehicle_type
                        
                        # Only draw on processed frame, not for counting
                        cvzone.cornerRect(frame, (x1, y1, w, h), l=9, rt=2)
            
            # Update tracking
            tracked_objects = self.tracker.update(detections)
            
            # Draw counting line
            cv2.line(frame, (self.limits[0], self.limits[1]), 
                    (self.limits[2], self.limits[3]), (0, 0, 255), 3)
            
            # Process tracked objects
            self.current_ids.clear()
            for track in tracked_objects:
                x1, y1, x2, y2, track_id = map(int, track)
                w, h = x2 - x1, y2 - y1
                cx, cy = x1 + w // 2, y1 + h // 2
                
                # Draw tracking info only if vehicle has crossed the line
                if track_id in self.crossed_vehicles:
                    cvzone.cornerRect(frame, (x1, y1, w, h), l=9, colorR=(0, 255, 0))  # Green for counted vehicles
                    cvzone.putTextRect(frame, f"COUNTED ID: {track_id}", 
                                     (max(0, x1), max(35, y1)), scale=1, thickness=1, offset=3)
                else:
                    cvzone.cornerRect(frame, (x1, y1, w, h), l=9, colorR=(255, 255, 0))  # Yellow for tracking
                    cvzone.putTextRect(frame, f"TRACKING ID: {track_id}", 
                                     (max(0, x1), max(35, y1)), scale=1, thickness=1, offset=3)
                
                self.current_ids.add(track_id)
                
                # Check line crossing - ONLY COUNT HERE
                if (min(self.limits[0], self.limits[2]) < cx < max(self.limits[0], self.limits[2]) and 
                    self.limits[1] - 20 < cy < self.limits[1] + 20 and 
                    track_id not in self.crossed_vehicles):  # Only count if not already crossed
                    
                    self.handle_vehicle_crossing(track_id, detected_objects, frame_detections, cx, cy)
            
            # Handle vehicle exits
            self.handle_vehicle_exits()
            
            # Update shared state for API - only show tracked detections
            tracked_detections = []
            for det in frame_detections:
                # Only show detections that are currently being tracked
                for track in tracked_objects:
                    x1, y1, x2, y2, track_id = map(int, track)
                    det_x1, det_y1, det_x2, det_y2 = det["bbox"]
                    
                    # Check if detection matches tracked object (with some tolerance)
                    if (abs(det_x1 - x1) < 20 and abs(det_y1 - y1) < 20 and 
                        abs(det_x2 - x2) < 20 and abs(det_y2 - y2) < 20):
                        tracked_detections.append(det)
                        break
            
            with detection_state.frame_lock:
                detection_state.latest_frame = self.raw_frame.copy()
                detection_state.latest_detections = tracked_detections.copy()
            
            # Store processed frame
            with self.frame_lock:
                self.processed_frame = frame.copy()
                self.current_detections = tracked_detections.copy()
            
            return True
            
        except Exception as e:
            print(f"Frame processing error: {e}")
            return True
    
    def map_yolo_to_vehicle_type(self, yolo_class_name):
        """Map YOLO class names to our vehicle types"""
        # Map various YOLO classes to our standardized vehicle types
        class_mapping = {
            'car': 'car',
            'truck': 'truck', 
            'bus': 'truck',  # Count buses as trucks
            'motorcycle': 'motorbike',
            'bicycle': 'bicycle',
            'person': None,  # Don't count people
            # Add more mappings as needed
        }
        
        # Try exact match first
        if yolo_class_name.lower() in class_mapping:
            return class_mapping[yolo_class_name.lower()]
        
        # Try partial matches
        yolo_lower = yolo_class_name.lower()
        if 'car' in yolo_lower or 'vehicle' in yolo_lower:
            return 'car'
        elif 'truck' in yolo_lower or 'lorry' in yolo_lower:
            return 'truck'
        elif 'bus' in yolo_lower:
            return 'truck'  # Count buses as trucks
        elif 'motor' in yolo_lower or 'bike' in yolo_lower:
            if 'bicycle' in yolo_lower or 'cycle' in yolo_lower:
                return 'bicycle'
            else:
                return 'motorbike'
        
        # Default to car for unknown vehicle types
        return 'car'
    
    def handle_vehicle_crossing(self, track_id, detected_objects, frame_detections, cx, cy):
        """Handle vehicle crossing the counting line - ONLY COUNT HERE"""
        # Mark this vehicle as having crossed the line
        self.crossed_vehicles.add(track_id)
        
        # Record time-in
        current_time = time.strftime("%H:%M:%S")
        self.time_track[track_id] = {"time_in": current_time, "time_out": None}
        
        # Determine vehicle class from closest detection
        det_obj_for_id = "car"  # default
        min_distance = float('inf')
        
        for det_box, det_class in detected_objects.items():
            det_cx = (det_box[0] + det_box[2]) / 2
            det_cy = (det_box[1] + det_box[3]) / 2
            distance = ((cx - det_cx) ** 2 + (cy - det_cy) ** 2) ** 0.5
            if distance < min_distance:
                min_distance = distance
                det_obj_for_id = det_class
        
        # Get confidence
        conf_for_id = 0.0
        for det in frame_detections:
            if det["label"] == det_obj_for_id:
                conf_for_id = det["confidence"]
                break
        
        # Store vehicle data
        self.vehicle_data[track_id] = {
            "vehicle_id": track_id,
            "class": det_obj_for_id,
            "confidence_score": conf_for_id,
            "time_in": current_time,
            "time_out": None,
            "speed_ms": None,
            "date": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Update counts ONLY when crossing line
        self.total_count.append(track_id)
        if det_obj_for_id in self.vehicle_class_counts:
            self.vehicle_class_counts[det_obj_for_id] += 1
        else:
            # Add new vehicle type if not in our list
            self.vehicle_class_counts[det_obj_for_id] = 1
        
        print(f"✅ VEHICLE COUNTED: {track_id} ({det_obj_for_id}) crossed line - Total: {len(self.total_count)}")
        print(f"Current counts: {self.vehicle_class_counts}")
        
        # Update Firebase counts immediately when vehicle crosses
        firebase_queue.put((f"/detected_vehicle/{today}/vehicle_class_count", 
                          'update', {det_obj_for_id: self.vehicle_class_counts[det_obj_for_id]}))
        
        # Update total count in Firebase
        firebase_queue.put((f"/detected_vehicle/{today}/total_count", 
                          'set', len(self.total_count)))
    
    def handle_vehicle_exits(self):
        """Handle vehicles exiting the frame"""
        all_tracked_ids = set(self.time_track.keys())
        exited_ids = all_tracked_ids - self.current_ids
        
        for ex_id in exited_ids:
            if self.time_track[ex_id]["time_out"] is None:
                self.time_track[ex_id]["time_out"] = time.strftime("%H:%M:%S")
                
                # Calculate speed
                try:
                    t1 = pd.Timedelta(self.time_track[ex_id]['time_out'])
                    t2 = pd.Timedelta(self.time_track[ex_id]['time_in'])
                    travel_time = int((t1-t2).total_seconds())
                    speed_ms = round(100 / travel_time, 2) if travel_time > 0 else 0.0
                except:
                    speed_ms = 0.0
                
                # Complete vehicle data ONLY for counted vehicles
                if ex_id in self.vehicle_data and ex_id in self.crossed_vehicles:
                    self.vehicle_data[ex_id]["time_out"] = self.time_track[ex_id]['time_out']
                    self.vehicle_data[ex_id]["speed_ms"] = speed_ms
                    
                    # Save to Firebase
                    firebase_queue.put((f"/detected_vehicle/{today}/individual_vehicle", 
                                      'push', self.vehicle_data[ex_id]))
                    
                    print(f"🚗 Vehicle {ex_id} completed journey: {self.vehicle_data[ex_id]}")
                    
                    # Cleanup
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
        """Get current detections - only return tracked objects"""
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
                
                time.sleep(0.033)  # ~30fps
            except Exception as e:
                if self.running:  # Only log if we're supposed to be running
                    print(f"Processing error: {e}")
                    time.sleep(1)
        
        # Cleanup
        print("Cleaning up pipeline...")
        if self.cap:
            self.cap.release()
        
        # Stop Firebase worker
        firebase_queue.put(None)
        
        print("Pipeline cleanup complete")
    
    def stop(self):
        """Stop the pipeline"""
        print("Stopping detection pipeline...")
        self.running = False

# Global pipeline instance
pipeline = None
pipeline_lock = threading.Lock()

def start_optimized_detection(camera_source):
    """Start the optimized detection pipeline"""
    global pipeline
    
    with pipeline_lock:
        # Stop existing pipeline if running
        if pipeline and pipeline.running:
            pipeline.stop()
            time.sleep(1)
        
        # Create new pipeline
        pipeline = OptimizedDetectionPipeline(camera_source)
        
    # Run the pipeline (this will block until stopped)
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