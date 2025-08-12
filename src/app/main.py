from contextlib import asynccontextmanager
from fastapi import FastAPI
import numpy as np

# db and model
from src.app.db.db_session import engine, async_session
from src.app.db.base import Base
from src.app.models.user import User  # ensure it's imported so Base knows the model

# global exceptions
from src.app.exceptions.custom_exceptions import *
from src.app.exceptions.error_handler import *

# middlware
from src.app.middleware.jwt_filter_middleware import JWTFilterMiddleware

# routers
from src.app.routes.user_router import user_router
from src.app.routes.dashboard_user_router import dashboard_user_router
from src.app.routes.dashboard_livestream_router import dashboard_livestream_router

# configurations
from src.app.core.cors_config import cors_middleware

# vehicle detection
from src.traffic_ai.vehicle_detection.vehicle_counter import start_optimized_detection
from src.traffic_ai.vehicle_detection.shared import detection_state

@asynccontextmanager
async def life_span(app: FastAPI):
    try:
        # Create database tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("Tables created successfully!")

        # Initialize shared state (backup for compatibility)
        with detection_state.frame_lock:
            detection_state.latest_frame = np.zeros((270, 480, 3), dtype=np.uint8)
            detection_state.latest_detections.clear()
        
        print("Shared state initialized")
        print("Server started - Livestream can be started via API")
        
        yield
        
    finally:
        # Cleanup any running detection
        from src.traffic_ai.vehicle_detection.vehicle_counter import get_pipeline
        pipeline = get_pipeline()
        if pipeline:
            pipeline.stop()
            print("Detection pipeline stopped")
        
        await engine.dispose()
        print("Application shutdown complete")

        
app = FastAPI(lifespan=life_span)

# middlwares
app.add_middleware(JWTFilterMiddleware)
# cors middleware
cors_middleware(app=app)

# user router
app.include_router(user_router)
app.include_router(dashboard_user_router)
app.include_router(dashboard_livestream_router)

# regiustering global exeception handler
app.add_exception_handler(InternalServerError, internal_server_error_handler)
app.add_exception_handler(ResourceNotFoundException, resource_not_found_handler)
app.add_exception_handler(DuplicateEntryException, duplicate_entry_exception_handler)
app.add_exception_handler(UnauthorizedAccessException, unauthorized_access_handler)
app.add_exception_handler(ForbiddenAccessException, forbidden_access_handler)
app.add_exception_handler(InvalidTokenException, invalid_token_handler)
