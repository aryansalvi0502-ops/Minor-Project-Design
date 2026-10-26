from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class SubjectAssessment(Base):
    __tablename__ = "subject_assessments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    subject_code = Column(String(50), nullable=False, index=True) # e.g. CS201, MATH101
    subject_name = Column(String(150), nullable=False)            # e.g. Data Structures & Algorithms
    assessment_type = Column(String(50), nullable=False)          # Midterm, Quiz, Assignment, Lab Practical, End-term
    
    obtained_score = Column(Float, nullable=False)                # Score achieved (e.g. 52.0)
    max_score = Column(Float, nullable=False, default=100.0)      # Max possible score (e.g. 100.0)
    weight_percentage = Column(Float, nullable=False, default=20.0) # Weight towards final grade %
    
    # Granular concept/subtopic evaluation: list of {"topic": str, "score": float, "max": float}
    topic_breakdown = Column(JSON, nullable=True, default=list)
    
    assessed_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    student = relationship("StudentProfile", back_populates="assessments")
