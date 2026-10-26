from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(Integer, ForeignKey("prediction_records.id", ondelete="SET NULL"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="active", nullable=False) # active, in_progress, completed, archived
    risk_level = Column(String(20), nullable=False)               # Low, Medium, High
    identified_areas = Column(JSON, nullable=False, default=list) # e.g. ["Low Semester GPA", "Attendance Warning"]
    recommended_actions = Column(JSON, nullable=False, default=list) # Specific recommendations
    weekly_goals = Column(JSON, nullable=False, default=list)        # Milestone goals
    suggested_timetable = Column(JSON, nullable=False, default=dict) # Daily schedule template
    completion_rate = Column(Float, default=0.0, nullable=False)     # 0.0 - 100.0%
    milestone_badges = Column(JSON, nullable=False, default=list)    # Badges unlocked: e.g. ["25%_starter", "50%_halfway"]
    streak_count = Column(Integer, default=0, nullable=False)        # Days/tasks completed streak
    review_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("StudentProfile", back_populates="recovery_plans")
    prediction = relationship("PredictionRecord", back_populates="recovery_plans")
    creator = relationship("User", foreign_keys=[created_by_user_id])
    tasks = relationship("RecoveryTask", back_populates="plan", cascade="all, delete-orphan", order_by="RecoveryTask.order")

class RecoveryTask(Base):
    __tablename__ = "recovery_tasks"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("recovery_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default="academic") # academic, attendance, study_habits, wellness, advisor
    is_completed = Column(Boolean, default=False, nullable=False)
    order = Column(Integer, default=0, nullable=False)
    target_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    plan = relationship("RecoveryPlan", back_populates="tasks")
