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
from src.app.routes.user_router import user_router
from src.app.routes.dashboard_api_router import dashboard_router

@asynccontextmanager
async def life_span(app: FastAPI):
  try:
    # create tables in db using the base class
    async with engine.begin() as conn:
      await conn.run_sync(Base.metadata.create_all)
      print("Tables are created successfully!")
      
    yield
  finally:
    await engine.dispose() # close the connection
    print("Connection close")


app = FastAPI(lifespan=life_span)

# middlwares
app.add_middleware(JWTFilterMiddleware)

# user router
app.include_router(user_router)
app.include_router(dashboard_router)

# regiustering global exeception handler
app.add_exception_handler(InternalServerError, internal_server_error_handler)
app.add_exception_handler(ResourceNotFoundException, resource_not_found_handler)
app.add_exception_handler(DuplicateEntryException, duplicate_entry_exception_handler)
app.add_exception_handler(UnauthorizedAccessException, unauthorized_access_handler)
app.add_exception_handler(ForbiddenAccessException, forbidden_access_handler)
