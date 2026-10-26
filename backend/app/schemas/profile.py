from datetime import datetime
from typing import Optional
from pydantic import ConfigDict, BaseModel, Field

class StudentProfileBase(BaseModel):
    student_institutional_id: str = Field(..., min_length=2, max_length=50, description="Institutional student ID (e.g., STU-10023)")
    department: str = Field(..., description="Academic department / school")
    semester: str = Field(..., description="Current study year (Year 1, Year 2, Year 3, Year 4)")
    age: float = Field(..., ge=15.0, le=75.0, description="Student age in years")
    gender: str = Field(..., description="Gender: Female, Male, or other")
    family_income: Optional[float] = Field(None, ge=0.0, description="Annual household income (optional, used to assess financial aid necessity)")
    internet_access: str = Field(default="Yes", description="Stable internet access at home ('Yes' or 'No')")
    study_hours_per_day: Optional[float] = Field(None, ge=0.0, le=24.0, description="Average self-study hours outside lecture per day")
    attendance_rate: float = Field(..., ge=0.0, le=100.0, description="Overall course attendance percentage (0.0 to 100.0)")
    assignment_delay_days: int = Field(default=0, ge=0, le=60, description="Average days assignments are delayed or overdue")
    travel_time_minutes: float = Field(default=25.0, ge=0.0, le=240.0, description="One-way transit or commute duration in minutes")
    part_time_job: str = Field(default="No", description="Employed part-time ('Yes' or 'No')")
    scholarship: str = Field(default="No", description="Scholarship recipient ('Yes' or 'No')")
    stress_index: Optional[float] = Field(None, ge=1.0, le=10.0, description="Self-reported stress level on a 1.0 to 10.0 scale")
    gpa: float = Field(..., ge=0.0, le=10.0, description="Cumulative Grade Point Average (0.0 to 10.0 scale)")
    semester_gpa: float = Field(..., ge=0.0, le=10.0, description="Most recent semester GPA (0.0 to 10.0 scale)")
    cgpa: float = Field(..., ge=0.0, le=10.0, description="Overall CGPA (0.0 to 10.0 scale)")
    parental_education: Optional[str] = Field("Bachelor", description="Highest parental education level")
    institution: Optional[str] = Field("MITAOE", description="Educational institution")
    degree_program: Optional[str] = Field("Computer Engineering", description="Degree / Major Program")
    admission_batch: Optional[str] = Field("2023-2027", description="Admission batch or academic year")
    curriculum_version: Optional[str] = Field("Autonomous 2022", description="Curriculum framework version")

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileUpdate(BaseModel):
    department: Optional[str] = None
    semester: Optional[str] = None
    age: Optional[float] = Field(None, ge=15.0, le=75.0)
    gender: Optional[str] = None
    family_income: Optional[float] = Field(None, ge=0.0)
    internet_access: Optional[str] = None
    study_hours_per_day: Optional[float] = Field(None, ge=0.0, le=24.0)
    attendance_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    assignment_delay_days: Optional[int] = Field(None, ge=0, le=60)
    travel_time_minutes: Optional[float] = Field(None, ge=0.0, le=240.0)
    part_time_job: Optional[str] = None
    scholarship: Optional[str] = None
    stress_index: Optional[float] = Field(None, ge=1.0, le=10.0)
    gpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    semester_gpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    parental_education: Optional[str] = None
    institution: Optional[str] = None
    degree_program: Optional[str] = None
    admission_batch: Optional[str] = None
    curriculum_version: Optional[str] = None

class StudentProfileOut(StudentProfileBase):
    id: int
    user_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    assigned_advisor_id: Optional[int] = None
    last_profile_update: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TopicBreakdownItem(BaseModel):
    topic: str
    score: float
    max: float = 100.0

class SubjectAssessmentCreate(BaseModel):
    subject_code: str = Field(..., min_length=2, max_length=50)
    subject_name: str = Field(..., min_length=2, max_length=150)
    assessment_type: str = Field(..., description="Midterm Exam, Quiz, Assignment, Lab Practical, etc.")
    obtained_score: float = Field(..., ge=0.0)
    max_score: float = Field(default=100.0, gt=0.0)
    weight_percentage: float = Field(default=20.0, ge=0.0, le=100.0)
    topic_breakdown: Optional[list[TopicBreakdownItem]] = Field(default_factory=list)

class SubjectAssessmentOut(BaseModel):
    id: int
    student_id: int
    subject_code: str
    subject_name: str
    assessment_type: str
    obtained_score: float
    max_score: float
    percentage: float
    weight_percentage: float
    topic_breakdown: Optional[list[dict]] = None
    assessed_date: datetime

    model_config = ConfigDict(from_attributes=True)

from pydantic import ConfigDict, BaseModel, Field, model_validator

class ConceptGapOut(BaseModel):
    topic: str
    concept_area: Optional[str] = None
    subject_code: str
    subject_name: str
    average_score: float
    average_percentage: Optional[float] = None
    severity: str # 'Critical Gap', 'Moderate Deficit', 'Needs Reinforcement'
    gap_severity: Optional[str] = None
    recommended_action: str
    remediation_recommendation: Optional[str] = None
    recommended_resource_query: str

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_aliases(self):
        if self.concept_area is None:
            self.concept_area = self.topic
        if self.average_percentage is None:
            self.average_percentage = self.average_score
        if self.gap_severity is None:
            self.gap_severity = self.severity
        if self.remediation_recommendation is None:
            self.remediation_recommendation = self.recommended_action
        return self

class SubjectSummaryOut(BaseModel):
    subject_code: str
    subject_name: str
    overall_percentage: float
    letter_grade: str
    assessment_count: int
    mastery_status: str # 'Mastered', 'Satisfactory', 'Needs Attention', 'Critical Deficit'
    weak_topics: list[str]

class LearningGapReportOut(BaseModel):
    overall_academic_average: float
    total_assessments_recorded: int
    subjects_summary: list[SubjectSummaryOut]
    critical_concept_gaps: list[ConceptGapOut]
    actionable_remediations: list[str]
    student_gaps: Optional[list[ConceptGapOut]] = None
    items: Optional[list[ConceptGapOut]] = None
    gaps: Optional[list[ConceptGapOut]] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_gaps_alias(self):
        if self.student_gaps is None:
            self.student_gaps = self.critical_concept_gaps
        if self.items is None:
            self.items = self.critical_concept_gaps
        if self.gaps is None:
            self.gaps = self.critical_concept_gaps
        return self

