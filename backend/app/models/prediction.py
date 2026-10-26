from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    model_version = Column(String(50), nullable=False)
    dropout_probability = Column(Float, nullable=False) # 0.0 - 1.0
    risk_score = Column(Float, nullable=False)          # 0.0 - 100.0
    risk_category = Column(String(20), nullable=False)  # Low, Medium, High
    threshold_used = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    input_snapshot = Column(JSON, nullable=False)       # JSON of the exact feature values evaluated
    prediction_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    student = relationship("StudentProfile", back_populates="predictions")
    explanation = relationship("PredictionExplanation", back_populates="prediction", uselist=False, cascade="all, delete-orphan")
    recovery_plans = relationship("RecoveryPlan", back_populates="prediction")

class PredictionExplanation(Base):
    __tablename__ = "prediction_explanations"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("prediction_records.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    base_value = Column(Float, nullable=False)
    feature_contributions = Column(JSON, nullable=False) # List of dicts with feature, value, shap_value, effect, description
    summary_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    prediction = relationship("PredictionRecord", back_populates="explanation")
