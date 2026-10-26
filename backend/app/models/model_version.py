from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from backend.app.core.database import Base

class ModelVersionMetadata(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_tag = Column(String(50), unique=True, index=True, nullable=False)
    algorithm_name = Column(String(100), nullable=False) # e.g. Random Forest Classifier, XGBoost
    is_active = Column(Boolean, default=True, nullable=False)
    training_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    dataset_version = Column(String(100), nullable=False)
    dataset_rows = Column(Integer, nullable=False)
    features_used = Column(JSON, nullable=False)
    metrics_train = Column(JSON, nullable=False)
    metrics_val = Column(JSON, nullable=False)
    metrics_test = Column(JSON, nullable=False)
    selected_threshold = Column(Float, nullable=False)
    calibration_method = Column(String(50), nullable=True)
    limitations_notes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
