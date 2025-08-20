import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI

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
from src.app.routes.dashboard_user_router import dashboard_user_router

# configurations
from src.app.core.cors_config import cors_middleware

# AI recommendation imports
from src.traffic_ai.traffic_recommendation.traffic_recommendation_ai import AIRecommendation
from src.traffic_ai.traffic_forecast.traffic_prediction_json_bldr import prediction_summary, prediction_detail


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
            
    except Exception as e:
        print(f"Error generating recommendations for {user_type}: {e}")


async def initialize_ai_recommendations():
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
        
        # initialize AI recommendations during startup
        await initialize_ai_recommendations()
        
        # print("Server started - Livestream can be started via API")
        
        yield
        
    finally:
        await engine.dispose()
        print("Application shutdown complete")
        
        
app = FastAPI(lifespan=life_span)

# middlwares
app.add_middleware(JWTFilterMiddleware)
# cors middleware
cors_middleware(app=app)

# user router
app.include_router(dashboard_user_router)
# app.include_router(dashboard_livestream_router)

# regiustering global exeception handler
app.add_exception_handler(InternalServerError, internal_server_error_handler)
app.add_exception_handler(ResourceNotFoundException, resource_not_found_handler)
app.add_exception_handler(DuplicateEntryException, duplicate_entry_exception_handler)
app.add_exception_handler(UnauthorizedAccessException, unauthorized_access_handler)
app.add_exception_handler(ForbiddenAccessException, forbidden_access_handler)
app.add_exception_handler(InvalidTokenException, invalid_token_handler)