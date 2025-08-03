from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.app.db.db_session import engine, async_session
from src.app.db.base import Base
from src.app.models.user import User  # ensure it's imported so Base knows the model


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


# use for route depends for async db connection/session
async def get_async_db():
  async with async_session as session:
    yield session


app = FastAPI(lifespan=life_span)
