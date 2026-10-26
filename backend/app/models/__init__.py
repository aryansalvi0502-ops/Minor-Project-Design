from backend.app.core.database import Base
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.prediction import PredictionRecord, PredictionExplanation
from backend.app.models.recovery import RecoveryPlan, RecoveryTask
from backend.app.models.advisor import AdvisorIntervention
from backend.app.models.notification import InAppNotification
from backend.app.models.audit import AuditEvent
from backend.app.models.model_version import ModelVersionMetadata
from backend.app.models.academic_marks import SubjectAssessment
from backend.app.models.timetable import StudentTimetableConfig, StudentDeadline
from backend.app.models.reminders import NotificationPreference, StudentReminder
from backend.app.models.learning_resources import LearningResource
from backend.app.models.feedback import SupportFeedback
from backend.app.models.curriculum import InstitutionProgram, OfficialCourse, StudentCourseEnrollment

__all__ = [
    "Base",
    "User",
    "StudentProfile",
    "PredictionRecord",
    "PredictionExplanation",
    "RecoveryPlan",
    "RecoveryTask",
    "AdvisorIntervention",
    "InAppNotification",
    "AuditEvent",
    "ModelVersionMetadata",
    "SubjectAssessment",
    "StudentTimetableConfig",
    "StudentDeadline",
    "NotificationPreference",
    "StudentReminder",
    "LearningResource",
    "SupportFeedback",
    "InstitutionProgram",
    "OfficialCourse",
    "StudentCourseEnrollment"
]

