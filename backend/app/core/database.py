import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}
engine_kwargs = {"echo": False, "future": True}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine_kwargs["connect_args"] = connect_args
else:
    # Production database (PostgreSQL / MySQL) connection pool configuration
    # pool_pre_ping automatically tests connections before checkout to prevent drops
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = int(os.getenv("DB_POOL_RECYCLE", "300"))
    engine_kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", "10"))
    engine_kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", "20"))

engine = create_engine(
    db_url,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
