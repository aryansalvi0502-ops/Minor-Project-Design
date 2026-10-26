from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class StudentTimetableConfig(Base):
    __tablename__ = "student_timetables"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    daily_study_goal_hours = Column(Float, nullable=False, default=3.0)
    preferred_study_window = Column(String(50), nullable=False, default="Evening") # Morning, Afternoon, Evening, Night
    
    # Custom unavailable intervals (e.g. part-time job, family commitments): list of {"day": str, "start": str, "end": str, "label": str}
    blocked_slots = Column(JSON, nullable=False, default=list)
    
    # Fixed institutional class lecture times: list of {"day": str, "start": str, "end": str, "subject": str, "code": str, "room": str}
    class_schedule = Column(JSON, nullable=False, default=list)
    
    # Dynamically generated adaptive schedule: dict with days as keys
    generated_timetable = Column(JSON, nullable=False, default=dict)
    
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    student = relationship("StudentProfile", back_populates="timetable_config")

class StudentDeadline(Base):
    __tablename__ = "student_deadlines"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    subject_code = Column(String(50), nullable=True)
    deadline_type = Column(String(50), nullable=False, default="assignment") # assignment, exam, quiz, project
    due_date = Column(DateTime, nullable=False)
    estimated_hours_needed = Column(Float, nullable=False, default=4.0)
    is_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    student = relationship("StudentProfile", back_populates="deadlines")
