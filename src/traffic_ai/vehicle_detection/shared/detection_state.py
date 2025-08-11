import threading
import numpy as np

# Global variables - Initialize with proper defaults
latest_frame = None  # Will be initialized in main.py
latest_detections = []
frame_lock = threading.Lock()