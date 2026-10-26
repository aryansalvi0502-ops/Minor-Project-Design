from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class AdvisorIntervention(Base):
    __tablename__ = "advisor_interventions"

    id = Column(Integer, primary_key=True, index=True)
    advisor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    intervention_type = Column(String(100), nullable=False) # e.g. Academic Tutoring, Attendance Counseling, Stress Management
    status = Column(String(50), default="scheduled", nullable=False) # requested_by_student, scheduled, completed, cancelled
    urgency = Column(String(20), default="Normal", nullable=False)   # Normal, High, Urgent
    modality = Column(String(50), default="In-Person", nullable=False) # In-Person, Video Consultation, Async Review
    meeting_date = Column(DateTime, nullable=True)
    meeting_link_or_location = Column(String(255), nullable=True)    # Room number or Zoom link
    
    student_request_notes = Column(Text, nullable=True) # Visible to both student and advisor
    advisor_notes = Column(Text, nullable=True)         # Staff-only notes (restricted from students)
    action_taken = Column(Text, nullable=True)
    follow_up_notes = Column(Text, nullable=True)       # Recommendations & post-session guidance
    follow_up_tasks = Column(Text, nullable=True)       # JSON or serialized tasks

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    advisor = relationship("User", foreign_keys=[advisor_id], back_populates="advisor_interventions")
    student = relationship("StudentProfile", foreign_keys=[student_id], back_populates="interventions")
