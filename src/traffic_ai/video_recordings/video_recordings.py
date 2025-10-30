from pathlib import Path
import cv2
from datetime import datetime
import threading

class ContinuousRecorder:
    def __init__(
        self, 
        recordings_dir: Path = Path(__file__).resolve().parent / "video_records", 
        fps: float = 15.0
    ):
        self.recordings_dir = Path(recordings_dir)
        self.recordings_dir.mkdir(parents=True, exist_ok=True)
        
        self.fps = fps
        self.frame_size = (480, 270)
        
        # Recording state
        self.video_writer = None
        self.ai_mode_enabled = False
        self.is_recording = False
        self.current_file_path = None
        
        # Thread safety
        self.lock = threading.Lock()
        
        # Video codec
        self.fourcc = cv2.VideoWriter.fourcc(*'XVID')  
    
    
    def _generate_filename(self) -> Path:
        """Generate timestamped filename"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"recording_{timestamp}.mp4"
        return self.recordings_dir / filename
    
    
    def set_ai_mode(self, enabled: bool):
        """Enable/disable AI detection mode"""
        with self.lock:
            self.ai_mode_enabled = enabled
    
    
    def start_recording(self) -> bool:
        """Initialize video writer and start recording"""
        with self.lock:
            if self.is_recording:
                return False
            
            try:
                self.current_file_path = self._generate_filename()
                
                self.video_writer = cv2.VideoWriter(
                    str(self.current_file_path),
                    self.fourcc,
                    self.fps,
                    self.frame_size
                )
                
                if not self.video_writer.isOpened():
                    raise Exception("Failed to open VideoWriter")
                
                self.is_recording = True
                return True
                
            except Exception as e:
                self.video_writer = None
                return False
    
    
    def write_frame(self, raw_frame, processed_frame=None):
        """Write frame to video file"""
        with self.lock:
            if not self.is_recording or self.video_writer is None:
                return
            
            try:
                # Choose frame based on AI mode
                if self.ai_mode_enabled and processed_frame is not None:
                    frame_to_write = processed_frame
                else:
                    frame_to_write = raw_frame
                
                self.video_writer.write(frame_to_write)
                
            except Exception as e:
                print(f"Error writing frame: {e}")
    
    
    def stop_recording(self) -> str | None:
        """Stop recording and finalize video file"""
        with self.lock:
            if not self.is_recording:
                return None
            
            try:
                if self.video_writer:
                    self.video_writer.release()
                    self.video_writer = None
                
                self.is_recording = False
                saved_file = str(self.current_file_path)
                print(f"Recording stopped: {self.current_file_path.name}")
                
                self.current_file_path = None
                return saved_file
                
            except Exception as e:
                print(f"Error stopping recording: {e}")
                return None
    
    
    def is_active(self) -> bool:
        """Check if recording is active"""
        with self.lock:
            return self.is_recording
    
    
    def cleanup(self):
        """Emergency cleanup on shutdown"""
        if self.is_recording:
            print("Emergency stop - finalizing recording")
            self.stop_recording()