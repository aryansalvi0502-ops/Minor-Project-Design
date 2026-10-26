from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    student_institutional_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Academic & Profile Fields (Features strictly matching verified dataset)
    department = Column(String(100), nullable=False) # Arts, Business, CS, Engineering, Science
    semester = Column(String(50), nullable=False)   # Year 1, Year 2, Year 3, Year 4
    age = Column(Float, nullable=False, default=20.0)
    gender = Column(String(20), nullable=False, default="Female") # Female, Male
    family_income = Column(Float, nullable=True)     # Imputed via training pipeline median if None
    internet_access = Column(String(10), nullable=False, default="Yes") # Yes, No
    study_hours_per_day = Column(Float, nullable=True) # Hours of daily study
    attendance_rate = Column(Float, nullable=False, default=85.0) # Attendance %
    assignment_delay_days = Column(Integer, nullable=False, default=1)
    travel_time_minutes = Column(Float, nullable=False, default=25.0)
    part_time_job = Column(String(10), nullable=False, default="No") # Yes, No
    scholarship = Column(String(10), nullable=False, default="No")   # Yes, No
    stress_index = Column(Float, nullable=True)      # 1.0 - 10.0 scale
    gpa = Column(Float, nullable=False, default=7.0) # 0.0 - 10.0 scale
    semester_gpa = Column(Float, nullable=False, default=7.0) # 0.0 - 10.0 scale
    cgpa = Column(Float, nullable=False, default=7.0) # 0.0 - 10.0 scale
    parental_education = Column(String(50), nullable=True, default="Bachelor") # None, High School, Bachelor, Master, PhD

    # Institutional & Curriculum Tracking (MITAOE)
    institution = Column(String(100), nullable=False, default="MITAOE")
    degree_program = Column(String(150), nullable=False, default="Computer Engineering")
    admission_batch = Column(String(50), nullable=False, default="2023-2027")
    curriculum_version = Column(String(50), nullable=False, default="Autonomous 2022")

    # Faculty advisor assignment
    assigned_advisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Metadata
    last_profile_update = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile", foreign_keys=[user_id])
    assigned_advisor = relationship("User", foreign_keys=[assigned_advisor_id])

    @property
    def full_name(self) -> str:
        return self.user.full_name if self.user and self.user.full_name else "Student"

    @property
    def email(self) -> str:
        return self.user.email if self.user and self.user.email else ""

    predictions = relationship("PredictionRecord", back_populates="student", cascade="all, delete-orphan", order_by="desc(PredictionRecord.prediction_timestamp)")
    recovery_plans = relationship("RecoveryPlan", back_populates="student", cascade="all, delete-orphan", order_by="desc(RecoveryPlan.created_at)")
    interventions = relationship("AdvisorIntervention", back_populates="student", cascade="all, delete-orphan", order_by="desc(AdvisorIntervention.created_at)")
    assessments = relationship("SubjectAssessment", back_populates="student", cascade="all, delete-orphan", order_by="desc(SubjectAssessment.assessed_date)")
    timetable_config = relationship("StudentTimetableConfig", back_populates="student", uselist=False, cascade="all, delete-orphan")
    deadlines = relationship("StudentDeadline", back_populates="student", cascade="all, delete-orphan", order_by="StudentDeadline.due_date")
    enrollments = relationship("StudentCourseEnrollment", back_populates="student", cascade="all, delete-orphan")

