import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
import numpy as np
from datetime import datetime, timezone

from sqlalchemy import select

# db, model and schema
from src.app.db.db_session import engine, async_session
from src.app.db.base import Base
from src.app.models.user import User  # ensure it's imported so Base knows the model
from src.app.models.history import History
from src.app.schemas.history_schema import HistorySchema

from sqlalchemy.ext.asyncio import AsyncSession

# global exceptions
from src.app.exceptions.custom_exceptions import *
from src.app.exceptions.error_handler import *

# middlware
from src.app.middleware.jwt_filter_middleware import JWTFilterMiddleware

# routers
from src.app.routes.user_router import user_router
from src.app.routes.dashboard_user_router import dashboard_user_router
from src.app.routes.dashboard_livestream_router import dashboard_livestream_router
from src.app.routes.dashboard_download_report_file_router import dl_file_router

# configurations
from src.app.core.cors_config import cors_middleware

# vehicle detection
from src.traffic_ai.vehicle_detection.vehicle_counter import start_optimized_detection
from src.traffic_ai.vehicle_detection.shared import detection_state

# AI recommendation imports
from src.traffic_ai.traffic_recommendation.traffic_recommendation_ai import AIRecommendation
from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import prediction_summary, prediction_detail

async def store_data_for_history(history_dict: dict, db: AsyncSession) -> History:
    """Store prediction and ai recommendation raw data in history table"""
    try:
        # Check if today's data already exists
        today = datetime.now(timezone.utc).date()
        result = await db.execute(
            select(History).where(
                History.created_at == today
            )
        )
        
        existing_data = result.scalar_one_or_none()
        
        if existing_data:
            print(f"History entry for {today} already exists, skipping...")
            return existing_data
        
        history_schema = HistorySchema(**history_dict)
        history_dict_dump = history_schema.model_dump()
        history_db = History(**history_dict_dump)
        
        db.add(history_db)
        await db.commit()
        await db.refresh(history_db)
        print("Fresh history data stored successfully.")
        
        return history_db
    except Exception as e:
         print(f"Error storing history data: {e}")
         raise

reco_handler = None
async def generate_user_recommendations(d1, d2, user_type):
    """Generate recommendations for a specific user type"""
    try:
        # Create AI recommendation instance
        ai_reco = AIRecommendation()
        
        # Check if today's cache exists
        if not ai_reco.recommendation_today_exists(user_type):
            # Run in thread to avoid blocking
            await asyncio.to_thread(ai_reco.generate_recommendations, d1, d2, user_type)
            print(f"Recommendations cached for {user_type}")
        else:
            print(f"Cache already exists for {user_type}")
        
        if user_type in ['admin', 'traffic_enforcer', 'city_engineer']:
            ai_reco.run_ai_recommendation(d1, d2, user_type)
            global reco_handler
            reco_handler = ai_reco.reco_json
            
    except Exception as e:
        print(f"Error generating recommendations for {user_type}: {e}")


async def initialize_ai_recommendations(db: AsyncSession):
    """Initialize AI recommendations for all user types during startup"""
    try:
        print("Starting AI recommendation initialization...")
        
        # Get prediction data
        d1 = prediction_summary()
        d2 = prediction_detail()
        
        # User types to initialize
        user_types = ['admin', 'traffic_enforcer', 'city_engineer', 'end_user']
        
        # Create AI recommendation tasks for each user type
        tasks = []
        for user_type in user_types:
            task = asyncio.create_task(generate_user_recommendations(d1, d2, user_type))
            tasks.append(task)
        
        # Wait for all recommendations to complete
        await asyncio.gather(*tasks)
        
        #  create a payload
        history_dict = {
            "prediction_summary": d1,
            "prediction_detail": d2,
            "ai_recommendation": reco_handler
        }
        
        print("Storing history data")
        await store_data_for_history(history_dict, db)
    except Exception as e:
        print(f"Error initializing AI recommendations: {e}")
        # Don't fail server startup if AI initialization fails
        pass


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
        
        # Get database session for initialization
        async with AsyncSession(engine) as db:
            # initialize AI recommendations during startup and store history data in database
            await initialize_ai_recommendations(db)
        
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
app.include_router(dl_file_router)

# regiustering global exeception handler
app.add_exception_handler(InternalServerError, internal_server_error_handler)
app.add_exception_handler(ResourceNotFoundException, resource_not_found_handler)
app.add_exception_handler(DuplicateEntryException, duplicate_entry_exception_handler)
app.add_exception_handler(UnauthorizedAccessException, unauthorized_access_handler)
app.add_exception_handler(ForbiddenAccessException, forbidden_access_handler)
app.add_exception_handler(InvalidTokenException, invalid_token_handler)
app.add_exception_handler(FileDownloadException, failed_file_download_handler)
