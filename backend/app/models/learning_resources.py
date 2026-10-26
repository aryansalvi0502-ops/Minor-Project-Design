from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text
from backend.app.core.database import Base

class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    department = Column(String(100), nullable=False, index=True) # CS, Engineering, Business, Science, Arts, General
    subject_code = Column(String(50), nullable=True, index=True)  # e.g. CS201, MATH101
    concept_tag = Column(String(100), nullable=True, index=True)  # e.g. "Data Structures", "Calculus", "Academic Writing"
    
    category = Column(String(50), nullable=False, default="Video Lecture") # Video Lecture, Interactive Practice, University Notes, Academic Guide
    difficulty = Column(String(20), nullable=False, default="Intermediate") # Beginner, Intermediate, Advanced
    url = Column(String(500), nullable=False)
    provider = Column(String(100), nullable=False) # MIT OpenCourseWare, Khan Academy, NPTEL, University Center
    estimated_minutes = Column(Integer, default=45, nullable=False)
    
    is_verified = Column(Boolean, default=True, nullable=False)
    rating = Column(Float, default=4.8, nullable=False)
    rating_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
