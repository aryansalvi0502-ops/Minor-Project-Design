from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class SupportFeedback(Base):
    __tablename__ = "support_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    feedback_type = Column(String(50), nullable=False) # recovery_plan, learning_resource, advisor_meeting, chatbot
    target_id = Column(Integer, nullable=True)         # ID of task, resource, intervention, etc.
    target_title = Column(String(255), nullable=True)  # Name/title of the item evaluated
    
    rating = Column(Integer, nullable=False)           # 1 to 5 stars
    effectiveness = Column(String(50), nullable=True)  # "Highly Effective", "Somewhat Helpful", "Needs Improvement"
    comments = Column(Text, nullable=True)             # Student qualitative feedback
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    user = relationship("User", back_populates="feedback_submissions")
