import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from src.app.core.settings import Settings

# Configure logger
logger = logging.getLogger("sqlalchemy_app")
logger.setLevel(logging.DEBUG if Settings.DEBUG else logging.INFO)

# optional: log to console
handler = logging.StreamHandler()
formatter = logging.Formatter(
"[%(asctime)s] [%(levelname)s] %(name)s - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)

# Create engine
engine = create_async_engine(Settings.db_uri(), echo=Settings.DEBUG)
logger.info(f"Engine created with URI={Settings.db_uri()} (echo={Settings.DEBUG})")

async_session = async_sessionmaker(engine, expire_on_commit=False)

# Dependency for routes
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
  logger.debug("Opening new async DB session...")
  async with async_session() as session:
    try:
      yield session
    finally:
      logger.debug("Closing async DB session...")
