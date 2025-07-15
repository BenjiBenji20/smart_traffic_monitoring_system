"""
DOESN'T NEED TO RUN THIS COD. :>
I JUST SAVED IT HERE JUST IN CASE ACCIDENCE HAPPENED TO THE PI.
THIS IS JUST A BACKUP CODE FOR PI STREAMING CODE SAVED IN PI ITSELF.

BOOT THIS IN PI ONLY
DEPENDENCIES:
aiortc
aiohttp
av
opencv-python==4.5.4.60

"""


from aiohttp import web
from picamera2 import Picamera2
from PIL import Image
import asyncio
import io
import logging
import numpy as np
import time

# Logging setup
logging.basicConfig(level=logging.INFO)

picam2 = Picamera2()
config = picam2.create_video_configuration(main={"size": (640, 480)})
picam2.configure(config)
picam2.start()

async def stream_handler(request):
    logging.info("📡 Client connected")

    response = web.StreamResponse(
        status=200,
        reason='OK',
        headers={
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
    )

    await response.prepare(request)

    try:
        while True:
          frame = picam2.capture_array("main")

          stream = io.BytesIO()
          Image.fromarray(frame).convert("RGB").save(stream, format='JPEG')
          jpeg_bytes = stream.getvalue()

          await response.write(b"--frame\r\n")
          await response.write(b"Content-Type: image/jpeg\r\n")
          await response.write(f"Content-Length: {len(jpeg_bytes)}\r\n\r\n".encode())
          await response.write(jpeg_bytes)
          await response.write(b"\r\n")
          await asyncio.sleep(0.01)


    except (asyncio.CancelledError, ConnectionResetError, BrokenPipeError):
        logging.warning("⚠️ Client disconnected.")
    except Exception as e:
        logging.error(f"❌ Unknown streaming error: {e}")
    finally:
        try:
            await response.write_eof()
        except:
            pass
        logging.info("🔁 Stream ended.")
        return response

app = web.Application()
app.router.add_get('/video', stream_handler)

logging.info("🚀 Starting MJPEG stream server on port 8080...")
web.run_app(app, port=8080)
