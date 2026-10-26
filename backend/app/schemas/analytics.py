from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RiskDistribution(BaseModel):
    low_count: int
    low_percentage: float
    medium_count: int
    medium_percentage: float
    high_count: int
    high_percentage: float
    total_students: int

class DepartmentRiskStat(BaseModel):
    department: str
    total_students: int
    avg_risk_score: float
    high_risk_count: int
    high_risk_pct: float
    avg_attendance: float
    avg_gpa: float

class SemesterRiskStat(BaseModel):
    semester: str
    total_students: int
    avg_risk_score: float
    high_risk_count: int
    high_risk_pct: float

class InterventionOutcomeStat(BaseModel):
    total_interventions: int
    completed_interventions: int
    completion_rate_pct: float
    scheduled_interventions: int
    requested_interventions: int

class AggregateAnalyticsOut(BaseModel):
    registered_students: int
    evaluated_students: int
    overall_risk_distribution: RiskDistribution
    department_breakdown: List[DepartmentRiskStat]
    semester_breakdown: List[SemesterRiskStat]
    intervention_outcomes: InterventionOutcomeStat
    active_model_version: Optional[str] = None
    reporting_timestamp: str
