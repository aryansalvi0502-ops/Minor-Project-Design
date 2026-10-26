from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.reminders import StudentReminder
from backend.app.schemas.notification import StudentReminderCreate

class ReminderService:
    @staticmethod
    def get_user_reminders(db: Session, user_id: int) -> List[StudentReminder]:
        """
        Retrieves all active and completed reminders for the authenticated student.
        """
        return (
            db.query(StudentReminder)
            .filter(StudentReminder.user_id == user_id)
            .order_by(StudentReminder.target_date.asc())
            .all()
        )

    @staticmethod
    def create_reminder(
        db: Session,
        user_id: int,
        reminder_in: StudentReminderCreate
    ) -> StudentReminder:
        """
        Validates and persists a new academic reminder associated with the authenticated user.
        """
        # Determine target datetime
        target_dt = reminder_in.due_at or reminder_in.target_date
        if not target_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Alert date and time is required."
            )

        now = datetime.now(timezone.utc)
        target_utc = target_dt if target_dt.tzinfo is not None else target_dt.replace(tzinfo=timezone.utc)
        if target_utc <= now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Alert date and time must be set in the future."
            )

        title = reminder_in.title.strip() if reminder_in.title else ""
        if not title:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reminder title cannot be empty."
            )

        channel = (reminder_in.channel or "in_app").lower().strip()
        if channel not in {"in_app", "email", "sms"}:
            channel = "in_app"

        reminder_type = reminder_in.reminder_type or reminder_in.category or "StudySession"

        reminder = StudentReminder(
            user_id=user_id,
            title=title,
            reminder_type=reminder_type,
            channel=channel,
            target_date=target_utc,
            is_completed=False,
            created_at=now
        )
        db.add(reminder)
        db.commit()
        db.refresh(reminder)
        return reminder

    @staticmethod
    def toggle_reminder(db: Session, user_id: int, reminder_id: int) -> StudentReminder:
        """
        Toggles completion/active status of a reminder.
        """
        reminder = db.query(StudentReminder).filter(StudentReminder.id == reminder_id).first()
        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reminder not found."
            )
        if reminder.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this reminder."
            )

        reminder.is_completed = not reminder.is_completed
        db.commit()
        db.refresh(reminder)
        return reminder

    @staticmethod
    def delete_reminder(db: Session, user_id: int, reminder_id: int) -> bool:
        """
        Deletes a reminder owned by the user.
        """
        reminder = db.query(StudentReminder).filter(StudentReminder.id == reminder_id).first()
        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reminder not found."
            )
        if reminder.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this reminder."
            )

        db.delete(reminder)
        db.commit()
        return True

reminder_service = ReminderService()
