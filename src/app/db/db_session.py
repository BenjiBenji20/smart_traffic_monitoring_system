from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from src.app.core.settings import settings
  
engine = create_async_engine(settings.db_uri(), echo=settings.DEBUG) # for async app

async_session = async_sessionmaker(engine, expire_on_commit=False)
