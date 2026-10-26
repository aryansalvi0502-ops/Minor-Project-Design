from datetime import datetime, timezone
from typing import Optional, Any
from pydantic import ConfigDict, BaseModel, field_validator, model_validator

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: str = "reminder"
    action_url: Optional[str] = None

class NotificationPreferenceOut(BaseModel):
    id: int
    user_id: int
    assignment_reminders: bool
    assignment_lead_hours: int
    daily_study_reminders: bool
    study_reminder_time: str
    advisor_meeting_reminders: bool
    advisor_lead_hours: int
    risk_alert_notifications: bool
    email_notifications: bool
    email_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    sms_enabled: bool = False
    study_session_reminders: Optional[bool] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_aliases(self):
        if self.email_enabled is None:
            self.email_enabled = self.email_notifications
        if self.in_app_enabled is None:
            self.in_app_enabled = self.risk_alert_notifications
        if self.study_session_reminders is None:
            self.study_session_reminders = self.daily_study_reminders
        return self

class NotificationPreferenceUpdate(BaseModel):
    assignment_reminders: Optional[bool] = None
    assignment_lead_hours: Optional[int] = None
    daily_study_reminders: Optional[bool] = None
    study_reminder_time: Optional[str] = None
    advisor_meeting_reminders: Optional[bool] = None
    advisor_lead_hours: Optional[int] = None
    risk_alert_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None
    email_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    study_session_reminders: Optional[bool] = None

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any):
        if isinstance(data, dict):
            if "email_enabled" in data and "email_notifications" not in data:
                data["email_notifications"] = data["email_enabled"]
            if "in_app_enabled" in data and "risk_alert_notifications" not in data:
                data["risk_alert_notifications"] = data["in_app_enabled"]
            if "study_session_reminders" in data and "daily_study_reminders" not in data:
                data["daily_study_reminders"] = data["study_session_reminders"]
        return data

class StudentReminderCreate(BaseModel):
    title: str
    reminder_type: Optional[str] = "StudySession"
    category: Optional[str] = None
    channel: Optional[str] = "in_app"
    target_date: Optional[datetime] = None
    due_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def unify_inputs(cls, data: Any):
        if isinstance(data, dict):
            dt = data.get("due_at") or data.get("target_date")
            if dt is not None:
                data["due_at"] = dt
                data["target_date"] = dt
            if not data.get("reminder_type") and data.get("category"):
                data["reminder_type"] = data["category"]
            if not data.get("channel"):
                data["channel"] = "in_app"
        return data

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Reminder title cannot be empty.")
        return v.strip()

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: Optional[str]) -> str:
        valid_channels = {"in_app", "email", "sms"}
        val = (v or "in_app").lower().strip()
        if val not in valid_channels:
            raise ValueError(f"Channel must be one of: {', '.join(sorted(valid_channels))}")
        return val

    @model_validator(mode="after")
    def validate_future_datetime(self):
        dt = self.due_at or self.target_date
        if dt is None:
            raise ValueError("Alert date and time is required.")
        now = datetime.now(timezone.utc)
        dt_utc = dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)
        if dt_utc <= now:
            raise ValueError("Alert date and time must be set in the future.")
        self.due_at = dt_utc
        self.target_date = dt_utc
        return self

class StudentReminderOut(BaseModel):
    id: int
    user_id: int
    title: str
    reminder_type: str
    channel: str = "in_app"
    target_date: datetime
    due_at: Optional[datetime] = None
    is_completed: bool = False
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def fill_computed(self):
        if self.due_at is None:
            self.due_at = self.target_date
        self.is_active = not self.is_completed
        return self

