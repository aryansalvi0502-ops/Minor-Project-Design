from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.security import require_role
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.prediction import PredictionRecord
from backend.app.models.advisor import AdvisorIntervention
from backend.app.schemas.analytics import (
    AggregateAnalyticsOut,
    RiskDistribution,
    DepartmentRiskStat,
    SemesterRiskStat,
    InterventionOutcomeStat
)
from ml.prediction.predictor import prediction_service

router = APIRouter()

@router.get("/overview", response_model=AggregateAnalyticsOut)
def get_aggregate_analytics(
    current_user: User = Depends(require_role(["management", "admin", "advisor"])),
    db: Session = Depends(get_db)
):
    """
    Returns aggregate, de-identified operational statistics for the institution.
    Protects individual identity by aggregating counts and percentages only.
    """
    total_students = db.query(StudentProfile).count()

    # Active predictions
    active_preds = db.query(PredictionRecord).filter(PredictionRecord.is_active == True).all()
    evaluated_count = len(active_preds)

    low_count = sum(1 for p in active_preds if p.risk_category == "Low")
    med_count = sum(1 for p in active_preds if p.risk_category == "Medium")
    high_count = sum(1 for p in active_preds if p.risk_category == "High")

    denom = evaluated_count if evaluated_count > 0 else 1
    risk_dist = RiskDistribution(
        low_count=low_count,
        low_percentage=round((low_count / denom) * 100.0, 1),
        medium_count=med_count,
        medium_percentage=round((med_count / denom) * 100.0, 1),
        high_count=high_count,
        high_percentage=round((high_count / denom) * 100.0, 1),
        total_students=total_students
    )

    # Department breakdown
    dept_stats = []
    departments = ["Arts", "Business", "CS", "Engineering", "Science"]
    for dept in departments:
        dept_profiles = db.query(StudentProfile).filter(StudentProfile.department == dept).all()
        dept_count = len(dept_profiles)
        
        # Join with active predictions
        scores = []
        high_risk_d_count = 0
        att_sum = 0.0
        gpa_sum = 0.0
        
        for p in dept_profiles:
            att_sum += p.attendance_rate
            gpa_sum += p.gpa
            # Check latest active prediction
            pred = next((pr for pr in p.predictions if pr.is_active), None)
            if pred:
                scores.append(pred.risk_score)
                if pred.risk_category == "High":
                    high_risk_d_count += 1

        avg_score = round(float(sum(scores) / len(scores)), 1) if scores else 0.0
        high_pct = round((high_risk_d_count / len(scores)) * 100.0, 1) if scores else 0.0
        avg_att = round(float(att_sum / dept_count), 1) if dept_count > 0 else 0.0
        avg_gpa = round(float(gpa_sum / dept_count), 2) if dept_count > 0 else 0.0

        dept_stats.append(DepartmentRiskStat(
            department=dept,
            total_students=dept_count,
            avg_risk_score=avg_score,
            high_risk_count=high_risk_d_count,
            high_risk_pct=high_pct,
            avg_attendance=avg_att,
            avg_gpa=avg_gpa
        ))

    # Semester breakdown
    sem_stats = []
    semesters = ["Year 1", "Year 2", "Year 3", "Year 4"]
    for sem in semesters:
        sem_profiles = db.query(StudentProfile).filter(StudentProfile.semester == sem).all()
        sem_count = len(sem_profiles)
        scores = []
        high_sem_count = 0
        for p in sem_profiles:
            pred = next((pr for pr in p.predictions if pr.is_active), None)
            if pred:
                scores.append(pred.risk_score)
                if pred.risk_category == "High":
                    high_sem_count += 1
        
        avg_score = round(float(sum(scores) / len(scores)), 1) if scores else 0.0
        high_pct = round((high_sem_count / len(scores)) * 100.0, 1) if scores else 0.0
        sem_stats.append(SemesterRiskStat(
            semester=sem,
            total_students=sem_count,
            avg_risk_score=avg_score,
            high_risk_count=high_sem_count,
            high_risk_pct=high_pct
        ))

    # Intervention Outcomes
    total_interventions = db.query(AdvisorIntervention).count()
    completed_interventions = db.query(AdvisorIntervention).filter(AdvisorIntervention.status == "completed").count()
    scheduled_interventions = db.query(AdvisorIntervention).filter(AdvisorIntervention.status == "scheduled").count()
    requested_interventions = db.query(AdvisorIntervention).filter(AdvisorIntervention.status == "requested_by_student").count()
    
    inter_denom = total_interventions if total_interventions > 0 else 1
    inter_stats = InterventionOutcomeStat(
        total_interventions=total_interventions,
        completed_interventions=completed_interventions,
        completion_rate_pct=round((completed_interventions / inter_denom) * 100.0, 1),
        scheduled_interventions=scheduled_interventions,
        requested_interventions=requested_interventions
    )

    return AggregateAnalyticsOut(
        registered_students=total_students,
        evaluated_students=evaluated_count,
        overall_risk_distribution=risk_dist,
        department_breakdown=dept_stats,
        semester_breakdown=sem_stats,
        intervention_outcomes=inter_stats,
        active_model_version=prediction_service.model_version,
        reporting_timestamp=datetime.now(timezone.utc).isoformat()
    )
