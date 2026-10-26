from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import ConfigDict, BaseModel, Field

class RecoveryTaskOut(BaseModel):
    id: int
    plan_id: int
    title: str
    description: Optional[str] = None
    category: str
    is_completed: bool
    order: int
    target_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class RecoveryTaskToggle(BaseModel):
    is_completed: bool

class WeeklyGoalItem(BaseModel):
    week: int
    focus_area: str
    target: str
    metric: str

class TimetableSlot(BaseModel):
    day: str
    time: str
    activity: str
    module: str

class RecoveryPlanOut(BaseModel):
    id: int
    student_id: int
    prediction_id: Optional[int] = None
    title: str
    status: str
    risk_level: str
    identified_areas: List[str]
    recommended_actions: List[str]
    weekly_goals: List[Dict[str, Any]]
    suggested_timetable: Dict[str, Any]
    completion_rate: float
    review_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tasks: List[RecoveryTaskOut] = []

    model_config = ConfigDict(from_attributes=True)

class RecoveryPlanCustomUpdate(BaseModel):
    status: Optional[str] = None
    suggested_timetable: Optional[Dict[str, Any]] = None
    review_date: Optional[datetime] = None

class PrioritizedActionItem(BaseModel):
    id: str
    rank: int # 1, 2, 3
    badge: str # 'Top Priority', 'High Priority', 'Medium Priority'
    title: str
    category: str # 'academic', 'attendance', 'assignment', 'wellness', 'advisor'
    rationale: str
    urgency: str # 'Immediate', 'This Week', 'Ongoing'
    action_type: str # 'navigate', 'toggle', 'open_modal'
    action_target: str # 'timetable', 'support', 'resources', 'recovery'
    cta_text: str
    is_completed: bool = False

class PrioritizedActionsOut(BaseModel):
    actions: List[PrioritizedActionItem]
    last_evaluated: datetime
    summary: str

class MilestoneCelebration(BaseModel):
    milestone_percentage: int
    title: str
    badge_name: str
    message: str
    streak_count: int

class TaskToggleResult(BaseModel):
    task: RecoveryTaskOut
    new_completion_rate: float
    streak_count: int
    milestone_unlocked: Optional[MilestoneCelebration] = None

class BlockedSlot(BaseModel):
    day: str
    start: str
    end: str
    label: str

class ClassSlot(BaseModel):
    day: str
    start: str
    end: str
    subject: str
    code: Optional[str] = ""
    room: Optional[str] = ""

class TimetableConfigUpdate(BaseModel):
    daily_study_goal_hours: Optional[float] = Field(None, ge=0.5, le=12.0)
    preferred_study_window: Optional[str] = Field(None, description="Morning, Afternoon, Evening, Night")
    blocked_slots: Optional[List[BlockedSlot]] = None
    class_schedule: Optional[List[ClassSlot]] = None

class TimetableConfigOut(BaseModel):
    student_id: int
    daily_study_goal_hours: float
    preferred_study_window: str
    blocked_slots: List[Dict[str, Any]]
    class_schedule: List[Dict[str, Any]]
    generated_timetable: Dict[str, Any]
    deadlines: List[Dict[str, Any]] = []
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StudentDeadlineCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    subject_code: Optional[str] = Field(None, max_length=50)
    deadline_type: str = Field(default="assignment", description="assignment, exam, quiz, project")
    due_date: datetime
    estimated_hours_needed: float = Field(default=3.0, ge=0.5, le=50.0)

class StudentDeadlineOut(BaseModel):
    id: int
    student_id: int
    title: str
    subject_code: Optional[str] = None
    deadline_type: str
    due_date: datetime
    estimated_hours_needed: float
    is_completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LearningResourceOut(BaseModel):
    id: int
    title: str
    description: str
    department: str
    subject_code: Optional[str] = None
    concept_tag: Optional[str] = None
    category: str
    difficulty: str
    url: str
    provider: str
    estimated_minutes: int
    is_verified: bool
    rating: float
    rating_count: int

    model_config = ConfigDict(from_attributes=True)

