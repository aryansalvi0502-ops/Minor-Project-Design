from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class InstitutionProgram(Base):
    __tablename__ = "institution_programs"

    id = Column(Integer, primary_key=True, index=True)
    institution = Column(String(100), nullable=False, default="MITAOE", index=True)
    program_name = Column(String(150), nullable=False, index=True)
    department = Column(String(100), nullable=False)
    degree_type = Column(String(50), nullable=False, default="B.Tech")
    duration_years = Column(Integer, nullable=False, default=4)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    courses = relationship("OfficialCourse", back_populates="program", cascade="all, delete-orphan")


class OfficialCourse(Base):
    __tablename__ = "official_courses"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("institution_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    institution = Column(String(100), nullable=False, default="MITAOE")
    curriculum_version = Column(String(50), nullable=False, default="Autonomous 2022", index=True)
    semester = Column(Integer, nullable=False, index=True) # 1 through 8
    course_code = Column(String(50), nullable=False, index=True)
    course_title = Column(String(200), nullable=False)
    credits = Column(Float, nullable=False, default=3.0)
    course_type = Column(String(50), nullable=False, default="Core") # Core, NSC, ESC, Elective, HSSM, Project
    syllabus_topics = Column(JSON, nullable=True, default=list) # verified syllabus topics
    source_url = Column(String(255), nullable=True)
    verification_status = Column(String(50), nullable=False, default="verified") # verified, provisional
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    program = relationship("InstitutionProgram", back_populates="courses")
    enrollments = relationship("StudentCourseEnrollment", back_populates="course")


class StudentCourseEnrollment(Base):
    __tablename__ = "student_course_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("official_courses.id", ondelete="SET NULL"), nullable=True, index=True)
    course_code = Column(String(50), nullable=False)
    course_title = Column(String(200), nullable=False)
    semester = Column(Integer, nullable=False)
    enrollment_type = Column(String(50), nullable=False, default="Core") # Core, Elective, Audit
    is_confirmed = Column(Boolean, nullable=False, default=True)
    confidence_level = Column(String(20), nullable=False, default="Medium") # Low, Medium, High
    difficult_topics = Column(JSON, nullable=True, default=list)
    academic_goal = Column(String(150), nullable=True, default="Grade A / 80%+")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("StudentProfile", back_populates="enrollments")
    course = relationship("OfficialCourse", back_populates="enrollments")
