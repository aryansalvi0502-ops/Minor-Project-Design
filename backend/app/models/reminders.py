from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    assignment_reminders = Column(Boolean, default=True, nullable=False)
    assignment_lead_hours = Column(Integer, default=24, nullable=False)
    
    daily_study_reminders = Column(Boolean, default=True, nullable=False)
    study_reminder_time = Column(String(10), default="18:00", nullable=False)
    
    advisor_meeting_reminders = Column(Boolean, default=True, nullable=False)
    advisor_lead_hours = Column(Integer, default=2, nullable=False)
    
    risk_alert_notifications = Column(Boolean, default=True, nullable=False)
    email_notifications = Column(Boolean, default=False, nullable=False)
    
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    user = relationship("User", back_populates="notification_preferences")

    @property
    def email_enabled(self) -> bool:
        return bool(self.email_notifications)

    @property
    def in_app_enabled(self) -> bool:
        return bool(self.risk_alert_notifications)

    @property
    def sms_enabled(self) -> bool:
        return False

    @property
    def study_session_reminders(self) -> bool:
        return bool(self.daily_study_reminders)

class StudentReminder(Base):
    __tablename__ = "student_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    reminder_type = Column(String(50), nullable=False, default="StudySession") # StudySession, Assignment, AdvisorMeeting, Custom
    channel = Column(String(50), nullable=False, default="in_app") # in_app, email, sms
    target_date = Column(DateTime, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    user = relationship("User", back_populates="reminders")

    @property
    def due_at(self) -> datetime:
        return self.target_date

    @property
    def is_active(self) -> bool:
        return not self.is_completed
