from datetime import datetime
from typing import Optional
from pydantic import ConfigDict, BaseModel, Field

class InterventionRequest(BaseModel):
    student_id: int
    intervention_type: str = Field(..., description="E.g., Academic Tutoring, Attendance Counseling, Study Skills")
    urgency: str = Field(default="Normal", description="Normal, High, Urgent")
    modality: str = Field(default="In-Person", description="In-Person, Video Consultation, Async Review")
    meeting_date: Optional[datetime] = None
    meeting_link_or_location: Optional[str] = None
    student_request_notes: Optional[str] = None
    advisor_notes: Optional[str] = None
    action_taken: Optional[str] = None
    follow_up_notes: Optional[str] = None

class InterventionUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(requested_by_student|scheduled|completed|cancelled)$")
    urgency: Optional[str] = None
    modality: Optional[str] = None
    meeting_date: Optional[datetime] = None
    meeting_link_or_location: Optional[str] = None
    advisor_notes: Optional[str] = None
    action_taken: Optional[str] = None
    follow_up_notes: Optional[str] = None
    follow_up_tasks: Optional[str] = None

class InterventionOut(BaseModel):
    id: int
    advisor_id: int
    student_id: int
    intervention_type: str
    status: str
    urgency: str = "Normal"
    modality: str = "In-Person"
    meeting_date: Optional[datetime] = None
    meeting_link_or_location: Optional[str] = None
    student_request_notes: Optional[str] = None
    advisor_notes: Optional[str] = None # Server-side logic filters this out for student viewers
    action_taken: Optional[str] = None
    follow_up_notes: Optional[str] = None
    follow_up_tasks: Optional[str] = None
    advisor_name: Optional[str] = None
    student_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AssignedStudentItem(BaseModel):
    student_profile_id: int
    student_institutional_id: str
    full_name: str
    email: str
    department: str
    semester: str
    attendance_rate: float
    gpa: float
    cgpa: float
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None
    last_prediction_date: Optional[datetime] = None
    active_recovery_plan_id: Optional[int] = None
    intervention_status: Optional[str] = None

class AppointmentConfirmRequest(BaseModel):
    meeting_date: datetime
    meeting_link_or_location: str
    advisor_notes: Optional[str] = None

class AppointmentCompleteRequest(BaseModel):
    action_taken: str
    follow_up_notes: Optional[str] = None
    follow_up_tasks: Optional[str] = None

class SupportFeedbackCreate(BaseModel):
    feedback_type: str = Field(..., description="recovery_plan, learning_resource, advisor_meeting, chatbot")
    target_id: Optional[int] = None
    target_title: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    effectiveness: Optional[str] = Field("Highly Effective", description="Highly Effective, Somewhat Helpful, Needs Improvement")
    comments: Optional[str] = None

class SupportFeedbackOut(BaseModel):
    id: int
    user_id: int
    feedback_type: str
    target_id: Optional[int] = None
    target_title: Optional[str] = None
    rating: int
    effectiveness: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

