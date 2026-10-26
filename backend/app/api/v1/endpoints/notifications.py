from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.notification import InAppNotification
from backend.app.models.reminders import NotificationPreference, StudentReminder
from backend.app.schemas.notification import (
    NotificationOut,
    NotificationCreate,
    NotificationPreferenceOut,
    NotificationPreferenceUpdate,
    StudentReminderCreate,
    StudentReminderOut
)

router = APIRouter()

# --- 1. Notification Feed ---

@router.get("/", response_model=List[NotificationOut])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = db.query(InAppNotification).filter(
        InAppNotification.user_id == current_user.id
    ).order_by(InAppNotification.created_at.desc()).limit(50).all()
    return notifications

@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(InAppNotification).filter(
        InAppNotification.id == notification_id,
        InAppNotification.user_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/mark-all-read", response_model=dict)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(InAppNotification).filter(
        InAppNotification.user_id == current_user.id,
        InAppNotification.is_read == False
    ).update({InAppNotification.is_read: True})
    db.commit()
    return {"message": "All notifications marked as read."}

# --- 2. Notification Preferences ---

@router.get("/preferences", response_model=NotificationPreferenceOut)
def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns user notification channels, lead hours, and reminder configurations.
    """
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()
    if not pref:
        pref = NotificationPreference(
            user_id=current_user.id,
            assignment_reminders=True,
            assignment_lead_hours=24,
            daily_study_reminders=True,
            study_reminder_time="18:00",
            advisor_meeting_reminders=True,
            advisor_lead_hours=2,
            risk_alert_notifications=True,
            email_notifications=False
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return pref

@router.put("/preferences", response_model=NotificationPreferenceOut)
def update_notification_preferences(
    pref_in: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates configurable assignment, study, and advisor reminder settings.
    """
    pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()
    if not pref:
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)

    data = pref_in.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(pref, field, val)

    pref.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(pref)
    return pref

from backend.app.services.reminder_service import reminder_service

# --- 3. Configurable Student Reminders ---

@router.get("/reminders", response_model=List[StudentReminderOut])
def get_my_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves student's custom and scheduled academic reminders.
    """
    return reminder_service.get_user_reminders(db=db, user_id=current_user.id)

@router.post("/reminders", response_model=StudentReminderOut, status_code=status.HTTP_201_CREATED)
def create_student_reminder(
    reminder_in: StudentReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new custom reminder for assignment deadlines, study blocks, or advisor check-ins.
    """
    return reminder_service.create_reminder(
        db=db,
        user_id=current_user.id,
        reminder_in=reminder_in
    )

@router.patch("/reminders/{reminder_id}/toggle", response_model=StudentReminderOut)
def toggle_student_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return reminder_service.toggle_reminder(
        db=db,
        user_id=current_user.id,
        reminder_id=reminder_id
    )

@router.delete("/reminders/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder_service.delete_reminder(
        db=db,
        user_id=current_user.id,
        reminder_id=reminder_id
    )
    return None
