import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

# db and model
from src.app.db.db_session import engine, async_session
from src.app.db.base import Base
from src.app.models.user import User  # ensure it's imported so Base knows the model

# global exceptions
from src.app.exceptions.custom_exceptions import *
from src.app.exceptions.error_handler import *

# middleware
from src.app.middleware.jwt_filter_middleware import JWTFilterMiddleware

# routers
from src.app.routes.dashboard_user_router import dashboard_user_router

# configurations
from src.app.core.cors_config import cors_middleware

# AI recommendation imports
from src.traffic_ai.traffic_recommendation.traffic_recommendation_ai import AIRecommendation
from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import prediction_summary, prediction_detail


# -------------------------
# Setup logging
# -------------------------
logger = logging.getLogger("traffic_app")
logger.setLevel(logging.DEBUG)  # keep DEBUG during dev, switch to INFO in prod
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "[%(asctime)s] [%(levelname)s] %(name)s - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)


async def generate_user_recommendations(d1, d2, user_type):
    """Generate recommendations for a specific user type"""
    try:
        ai_reco = AIRecommendation()
        
        if not ai_reco.recommendation_today_exists(user_type):
            await asyncio.to_thread(ai_reco.generate_recommendations, d1, d2, user_type)
            logger.info(f"Recommendations cached for {user_type}")
        else:
            logger.info(f"Cache already exists for {user_type}")
            
    except Exception as e:
        logger.error(f"Error generating recommendations for {user_type}: {e}", exc_info=True)


async def initialize_ai_recommendations():
    """Initialize AI recommendations for all user types during startup"""
    try:
        logger.info("Starting AI recommendation initialization...")
        
        d1 = prediction_summary()
        d2 = prediction_detail()
        
        user_types = ['admin', 'traffic_enforcer', 'city_engineer', 'end_user']
        tasks = [asyncio.create_task(generate_user_recommendations(d1, d2, u)) for u in user_types]
        
        await asyncio.gather(*tasks)
        
        logger.info("AI recommendation initialization completed.")
    except Exception as e:
        logger.error(f"Error initializing AI recommendations: {e}", exc_info=True)


@asynccontextmanager
async def life_span(app: FastAPI):
    try:
        # Create database tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Tables created successfully!")
        
        # Initialize AI recommendations
        await initialize_ai_recommendations()
        
        yield
        
    finally:
        await engine.dispose()
        logger.info("Application shutdown complete.")


app = FastAPI(lifespan=life_span)

# Middlewares
app.add_middleware(JWTFilterMiddleware)
cors_middleware(app=app)

# Routers
app.include_router(dashboard_user_router)

# Exception Handlers
app.add_exception_handler(InternalServerError, internal_server_error_handler)
app.add_exception_handler(ResourceNotFoundException, resource_not_found_handler)
app.add_exception_handler(DuplicateEntryException, duplicate_entry_exception_handler)
app.add_exception_handler(UnauthorizedAccessException, unauthorized_access_handler)
app.add_exception_handler(ForbiddenAccessException, forbidden_access_handler)
app.add_exception_handler(InvalidTokenException, invalid_token_handler)
