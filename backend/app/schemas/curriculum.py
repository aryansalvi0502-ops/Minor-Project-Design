from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class InstitutionProgramOut(BaseModel):
    id: int
    institution: str
    program_name: str
    department: str
    degree_type: str
    duration_years: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class OfficialCourseOut(BaseModel):
    id: int
    program_id: int
    institution: str
    curriculum_version: str
    semester: int
    course_code: str
    course_title: str
    credits: float
    course_type: str
    syllabus_topics: Optional[List[str]] = None
    source_url: Optional[str] = None
    verification_status: str

    model_config = ConfigDict(from_attributes=True)

class StudentCourseEnrollmentCreate(BaseModel):
    course_code: str = Field(..., min_length=2, max_length=50)
    course_title: str = Field(..., min_length=2, max_length=200)
    semester: int = Field(..., ge=1, le=8)
    course_id: Optional[int] = None
    enrollment_type: str = Field(default="Core", description="'Core', 'Elective', 'Audit'")
    is_confirmed: bool = True
    confidence_level: str = Field(default="Medium", description="'Low', 'Medium', 'High'")
    difficult_topics: Optional[List[str]] = Field(default_factory=list)
    academic_goal: Optional[str] = Field(default="Target Grade A (80%+)")

class StudentCourseEnrollmentUpdate(BaseModel):
    confidence_level: Optional[str] = None
    difficult_topics: Optional[List[str]] = None
    academic_goal: Optional[str] = None
    is_confirmed: Optional[bool] = None

class StudentCourseEnrollmentOut(BaseModel):
    id: int
    student_id: int
    course_id: Optional[int] = None
    course_code: str
    course_title: str
    semester: int
    enrollment_type: str
    is_confirmed: bool
    confidence_level: str
    difficult_topics: Optional[List[str]] = None
    academic_goal: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CourseImportItem(BaseModel):
    program_name: str
    semester: int = Field(..., ge=1, le=8)
    course_code: str = Field(..., min_length=2, max_length=50)
    course_title: str = Field(..., min_length=2, max_length=200)
    credits: float = Field(default=3.0, ge=0.5, le=12.0)
    course_type: str = Field(default="Core")
    curriculum_version: Optional[str] = "Autonomous 2022"
    syllabus_topics: Optional[List[str]] = Field(default_factory=list)
    source_url: Optional[str] = None

class CourseImportRequest(BaseModel):
    courses: List[CourseImportItem]

class CourseImportResponse(BaseModel):
    imported_count: int
    updated_count: int
    total_processed: int
    errors: List[str] = []
