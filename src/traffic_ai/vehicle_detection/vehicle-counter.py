import logging

import requests.exceptions
from ultralytics import YOLO
from ClassNames import ClassNames
import cv2
import cvzone
from sort import *
import numpy as np
import time
import pandas as pd

try:
    # Initialize video capture and model
    cap = cv2.VideoCapture("images/videoplayback.mp4")

    # Use ONNX model and optimize inference
    model = YOLO("image-weights/yolo11n.onnx")

    # Load vehicle class names
    classes = ClassNames()

    # Load region of interest mask (border)
    border = cv2.imread("images/harang.png")

    # Initialize SORT tracker
    tracker = Sort(max_age=20, min_hits=3, iou_threshold=0.3)

    # Line position: (x1, y1), (x2, y2)
    limits = [530, 110, 150, 110]

    AREA_DISTANCE_M = 100  # The area distance in meter of C-4 Road

    # store time-in and time-out by assigned vehilce ID
    time_track = {}
    current_ids = set()  # Store currently visible IDs from tracker in each frame
    counted_ids = set()  # Store or track counted ids to avoid duplicate

    # Counting variables
    total_count = []
    vehicle_class_cnt_json_data = {vehicle_class: 0 for vehicle_class in classes.vehicle_class()}
    vehicle_json_data = {}  # Hold final JSON object

    # Enable OpenCV optimizations
    cv2.setUseOptimized(True)
    cv2.setNumThreads(4)

    while True:
        success, img = cap.read()
        if not success:
            break

        # Resize for faster inference
        img = cv2.resize(img, (640, 360))
        border_resized = cv2.resize(border, (640, 360))
        frame_region = cv2.bitwise_and(img, border_resized)

        # Run detection (no stream=True for ONNX)
        results = model.predict(frame_region, classes=classes.classified_vehicle(), verbose=False)

        detections = np.empty((0, 5))
        detected_objects = {}

        # Collect detections
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                w, h = x2 - x1, y2 - y1
                cls = int(box.cls[0])
                conf = round(float(box.conf[0]), 2)

                det_obj = classes.class_names[cls]

                if conf >= 0.3:
                    # Draw box
                    cvzone.cornerRect(img, (x1, y1, w, h), l=9, rt=2)
                    current_array = np.array([x1, y1, x2, y2, conf])
                    detections = np.vstack((detections, current_array))

                    # Save class for each box position (for counting after tracking)
                    detected_objects[(x1, y1, x2, y2)] = det_obj

        # Track objects with SORT
        resultTracker = tracker.update(detections)

        # Draw virtual line to track counting
        cv2.line(img, (limits[0], limits[1]), (limits[2], limits[3]), (0, 0, 255), 3)

        current_ids.clear()  # clear set for new loop
        for result in resultTracker:
            x1, y1, x2, y2, id = map(int, result)
            w, h = x2 - x1, y2 - y1
            cx, cy = x1 + w // 2, y1 + h // 2

            # Draw tracker box and ID
            cvzone.cornerRect(img, (x1, y1, w, h), l=9, colorR=(255, 0, 0))
            cvzone.putTextRect(img, f"ID: {id}", (max(0, x1), max(35, y1)), scale=1, thickness=1, offset=3)

            # Handle current ids
            current_vehicle_id = int(result[4])
            current_ids.add(current_vehicle_id)

            # Count vehicle only once per ID when crossing line
            if min(limits[0], limits[2]) < cx < max(limits[0], limits[2]) and limits[1] - 20 < cy < limits[1] + 20 \
                    and id not in total_count:
                # track the vehicle time-in
                counted_ids.add(id)

                # Record time-in
                time_track[id] = {"time_in": time.strftime("%H:%M:%S"), "time_out": None}

                # store structured JSON data
                date = time.strftime("%Y-%m-%d %H:%M:%S")
                vehicle_json_data[id] = {
                    "vehicle_id": id,
                    "class": det_obj,
                    "confidence_score": conf,
                    "time_in": time_track[id]['time_in'],
                    "time_out": None,
                    "speed_ms": None,
                    "date": date
                }

                # log
                print(f"\nVehicle Id: {id} | Time in: {time_track[id]['time_in']}")

                # log total count and count per vehicle class
                total_count.append(id)
                vehicle_class_cnt_json_data[det_obj] += 1  # count vehicle by class

                print(f"Total Count: {len(total_count)}")
                for cls, count in vehicle_class_cnt_json_data.items():
                    print(f"{cls}: {count}")

        # Record time-out (when tracked vehicle exited the frame)
        all_tracked_ids = set(time_track.keys())  # Get previously seen IDs
        exited_ids = all_tracked_ids - current_ids  # IDs that disappeared
        for ex_id in exited_ids:
            if time_track[ex_id]["time_out"] is None:
                time_track[ex_id]["time_out"] = time.strftime("%H:%M:%S")
                print(f"Vehicle ID: {ex_id} | Time out: {time_track[ex_id]['time_out']}")

                # Calcuulate the speed of the moving vegicle
                try:
                    t1 = pd.Timedelta(time_track[ex_id]['time_out'])
                    t2 = pd.Timedelta(time_track[ex_id]['time_in'])
                    travel_time = int((t1-t2).total_seconds())

                    if travel_time > 0:
                        speed_ms = round(AREA_DISTANCE_M / travel_time, 2)
                    else:
                        speed_ms = 0.0
                except ZeroDivisionError:
                    speed_ms = None
                    logging.log(f"{AREA_DISTANCE_M} Cannot be divided by 0")

                # complete JSON
                if ex_id in vehicle_json_data:
                    vehicle_json_data[ex_id]["time_out"] = time_track[ex_id]['time_out']
                    vehicle_json_data[ex_id]["speed_ms"] = speed_ms

                    del time_track[ex_id]  # delete sent IDs to avoid big set and inefficient loop

                print(f"Final Data for ID {ex_id}: {vehicle_json_data[ex_id]}")

        # Display livestream
        cv2.imshow("YOLOv11 Vehicle Detection", img)
        key = cv2.waitKey(1)
        if key == ord('q'):
            break

    # Release resources
    cap.release()
    cv2.destroyAllWindows()
except FileNotFoundError:
    logging.info("File not found")
except requests.exceptions.ConnectionError:
    logging.info("Failed to connect to the livestream")
except Exception:
    logging.exception("An error occurred")
