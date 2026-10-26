from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.prediction import PredictionRecord, PredictionExplanation
from backend.app.models.model_version import ModelVersionMetadata
from backend.app.schemas.prediction import (
    PredictionOut,
    PredictionHistoryItem,
    ExplanationOut,
    PredictionTrendOut,
    TrendFactorShift,
    WhatIfSimulationRequest,
    WhatIfSimulationResponse
)
from backend.app.schemas.admin import ModelMetadataOut
from backend.app.services.audit_service import log_audit_event
from ml.prediction.predictor import prediction_service

router = APIRouter()

@router.get("/latest", response_model=PredictionOut)
def get_my_latest_prediction(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The latest prediction endpoint is intended for student self-service."
        )

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please create your profile first."
        )

    pred = db.query(PredictionRecord).filter(
        PredictionRecord.student_id == profile.id,
        PredictionRecord.is_active == True
    ).first()

    if not pred:
        # Check if model is ready and generate on the fly
        from backend.app.api.v1.endpoints.profiles import _trigger_prediction_and_plan
        pred = _trigger_prediction_and_plan(profile, db)
        if not pred:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Prediction model is currently unavailable or untrained."
            )

    explanation_data = None
    if pred.explanation:
        explanation_data = ExplanationOut(
            base_value=pred.explanation.base_value,
            summary_text=pred.explanation.summary_text,
            feature_contributions=pred.explanation.feature_contributions
        )

    return PredictionOut(
        id=pred.id,
        student_id=pred.student_id,
        model_version=pred.model_version,
        dropout_probability=pred.dropout_probability,
        risk_score=pred.risk_score,
        risk_category=pred.risk_category,
        threshold_used=pred.threshold_used,
        is_active=pred.is_active,
        prediction_timestamp=pred.prediction_timestamp,
        explanation=explanation_data
    )

@router.get("/student/{student_profile_id}", response_model=PredictionOut)
def get_student_prediction_authorized(
    student_profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_profile_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    if current_user.role == "student" and profile.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif current_user.role == "advisor" and profile.assigned_advisor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Student not assigned to you.")
    elif current_user.role == "management":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Management has aggregate access only.")

    pred = db.query(PredictionRecord).filter(
        PredictionRecord.student_id == profile.id,
        PredictionRecord.is_active == True
    ).first()

    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active prediction found for this student.")

    explanation_data = None
    if pred.explanation:
        explanation_data = ExplanationOut(
            base_value=pred.explanation.base_value,
            summary_text=pred.explanation.summary_text,
            feature_contributions=pred.explanation.feature_contributions
        )

    return PredictionOut(
        id=pred.id,
        student_id=pred.student_id,
        model_version=pred.model_version,
        dropout_probability=pred.dropout_probability,
        risk_score=pred.risk_score,
        risk_category=pred.risk_category,
        threshold_used=pred.threshold_used,
        is_active=pred.is_active,
        prediction_timestamp=pred.prediction_timestamp,
        explanation=explanation_data
    )

@router.get("/history", response_model=List[PredictionHistoryItem])
def get_prediction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []

    history = db.query(PredictionRecord).filter(
        PredictionRecord.student_id == profile.id
    ).order_by(PredictionRecord.prediction_timestamp.desc()).all()

    return history

@router.get("/model-card", response_model=ModelMetadataOut)
def get_active_model_card(db: Session = Depends(get_db)):
    """
    Public model transparency card with verified evaluation metrics, calibration method,
    threshold, dataset provenance, and documented ethical limitations.
    """
    model_record = db.query(ModelVersionMetadata).filter(
        ModelVersionMetadata.is_active == True
    ).order_by(ModelVersionMetadata.id.desc()).first()

    if not model_record:
        # Fallback to metadata.json directly
        if prediction_service.is_ready:
            meta = prediction_service.metadata
            return ModelMetadataOut(
                id=1,
                version_tag=meta["version_tag"],
                algorithm_name=meta["algorithm_name"],
                is_active=True,
                training_date=meta["training_date"],
                dataset_version=meta["dataset_version"],
                dataset_rows=meta["dataset_rows"],
                features_used=meta["features_used"],
                metrics_train=meta["metrics_train"],
                metrics_val=meta["metrics_val"],
                metrics_test=meta["metrics_test"],
                selected_threshold=meta["selected_threshold"],
                calibration_method=meta.get("calibration_method", "sigmoid"),
                limitations_notes=meta["limitations_notes"],
                created_at=datetime.now(timezone.utc)
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained model version available."
        )

    return model_record

class GPASimulationRequest(BaseModel):
    gpa: float = Field(..., ge=0.0, le=10.0)
    semester_gpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)

@router.post("/simulate-gpa")
def simulate_gpa(
    req: GPASimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulates student dropout risk and policy threshold segregation when GPA (0.0 - 10.0 scale) is adjusted.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    sem_gpa = req.semester_gpa if req.semester_gpa is not None else req.gpa
    cgpa_val = req.cgpa if req.cgpa is not None else req.gpa

    feature_dict = {
        "Age": profile.age,
        "Gender": profile.gender,
        "Family_Income": profile.family_income,
        "Internet_Access": profile.internet_access,
        "Study_Hours_per_Day": profile.study_hours_per_day,
        "Attendance_Rate": profile.attendance_rate,
        "Assignment_Delay_Days": profile.assignment_delay_days,
        "Travel_Time_Minutes": profile.travel_time_minutes,
        "Part_Time_Job": profile.part_time_job,
        "Scholarship": profile.scholarship,
        "Stress_Index": profile.stress_index,
        "GPA": round((req.gpa / 10.0) * 4.0, 3),
        "Semester_GPA": round((sem_gpa / 10.0) * 4.0, 3),
        "CGPA": round((cgpa_val / 10.0) * 4.0, 3),
        "Semester": profile.semester,
        "Department": profile.department,
        "Parental_Education": profile.parental_education
    }

    pred_res = prediction_service.predict_student_risk(feature_dict)

    if req.gpa >= 8.0:
        gpa_tier = "Distinction / Safe Standing (>= 8.0/10)"
    elif req.gpa >= 6.0:
        gpa_tier = "Satisfactory Standing (6.0 - 7.9/10)"
    elif req.gpa >= 5.0:
        gpa_tier = "Academic Warning (5.0 - 5.9/10, Below 6.0 Threshold)"
    else:
        gpa_tier = "Critical Academic Concern (< 5.0/10)"

    return {
        "simulated_gpa": req.gpa,
        "simulated_gpa_model_scale": round((req.gpa / 10.0) * 4.0, 2),
        "gpa_tier": gpa_tier,
        "risk_score": pred_res["risk_score"],
        "risk_category": pred_res["risk_category"],
        "dropout_probability": pred_res["dropout_probability"],
        "threshold_used": pred_res["threshold_used"]
    }

@router.get("/trends", response_model=PredictionTrendOut)
def get_prediction_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes comparable prediction trajectory, score delta, and shift-factor attribution
    across successive prediction snapshots.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    history = db.query(PredictionRecord).filter(
        PredictionRecord.student_id == profile.id
    ).order_by(PredictionRecord.prediction_timestamp.desc()).all()

    if not history:
        raise HTTPException(status_code=404, detail="No prediction records found")

    curr = history[0]
    prev = history[1] if len(history) > 1 else None

    history_items = [
        PredictionHistoryItem(
            id=h.id,
            dropout_probability=h.dropout_probability,
            risk_score=h.risk_score,
            risk_category=h.risk_category,
            model_version=h.model_version,
            prediction_timestamp=h.prediction_timestamp
        )
        for h in history
    ]

    if prev is None:
        return PredictionTrendOut(
            current_risk_score=curr.risk_score,
            previous_risk_score=None,
            score_delta=None,
            direction="Initial Baseline",
            velocity_label="Baseline evaluation established",
            total_evaluations=1,
            history_timeline=history_items,
            factor_shifts=[],
            trend_narrative=f"Initial early-warning baseline established at {curr.risk_score:.0f}/100 ({curr.risk_category} Risk). Subsequent profile updates will track comparative trajectories."
        )

    delta = round(curr.risk_score - prev.risk_score, 1)
    if delta <= -2.0:
        direction = "Improving"
        vel_label = f"▼ {abs(delta):.1f} pts reduction"
    elif delta >= 2.0:
        direction = "Deteriorating"
        vel_label = f"▲ {abs(delta):.1f} pts increase"
    else:
        direction = "Stable"
        vel_label = "Stable (±2 pts)"

    # Compare snapshots
    curr_snap = curr.input_snapshot or {}
    prev_snap = prev.input_snapshot or {}
    shifts: List[TrendFactorShift] = []

    feature_meta = {
        "Attendance_Rate": ("Course Attendance Rate", "%", False),
        "GPA": ("Grade Point Average", "/4.0", False),
        "Study_Hours_per_Day": ("Daily Study Commitment", "h", False),
        "Assignment_Delay_Days": ("Assignment Turnaround Delay", " days", True),
        "Stress_Index": ("Self-Reported Stress Index", "/10", True)
    }

    shift_narratives = []
    for feat, (label, unit, higher_is_worse) in feature_meta.items():
        if feat in curr_snap and feat in prev_snap:
            c_val = float(curr_snap[feat])
            p_val = float(prev_snap[feat])
            diff = round(c_val - p_val, 2)
            if abs(diff) >= 0.01:
                if higher_is_worse:
                    impact = "increases_risk" if diff > 0 else "decreases_risk"
                else:
                    impact = "decreases_risk" if diff > 0 else "increases_risk"

                sign = "+" if diff > 0 else ""
                n = f"{label} shifted by {sign}{diff}{unit} ({p_val} -> {c_val}), which {impact.replace('_', ' ')}."
                shift_narratives.append(n)
                shifts.append(TrendFactorShift(
                    feature=feat,
                    label=label,
                    previous_value=p_val,
                    current_value=c_val,
                    delta=diff,
                    impact=impact,
                    narrative=n
                ))

    if direction == "Improving":
        narrative = f"Early-warning risk score has improved by {abs(delta):.1f} points (from {prev.risk_score:.0f} to {curr.risk_score:.0f}/100). "
        if shift_narratives:
            narrative += "Key improvements include: " + "; ".join(shift_narratives[:2]) + "."
    elif direction == "Deteriorating":
        narrative = f"Early-warning risk score has risen by {abs(delta):.1f} points (from {prev.risk_score:.0f} to {curr.risk_score:.0f}/100). "
        if shift_narratives:
            narrative += "Primary shift factors: " + "; ".join(shift_narratives[:2]) + ". Recommended: consult advisor and review recovery tasks."
    else:
        narrative = f"Early-warning risk score is stable at {curr.risk_score:.0f}/100 ({curr.risk_category} Risk)."

    return PredictionTrendOut(
        current_risk_score=curr.risk_score,
        previous_risk_score=prev.risk_score,
        score_delta=delta,
        direction=direction,
        velocity_label=vel_label,
        total_evaluations=len(history),
        history_timeline=history_items,
        factor_shifts=shifts,
        trend_narrative=narrative
    )

@router.post("/simulate-what-if", response_model=WhatIfSimulationResponse)
def simulate_what_if(
    req: WhatIfSimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Hypothetical multi-factor simulation evaluating model sensitivity across GPA,
    study hours, attendance rate, assignment turnaround, and stress levels.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    pred = db.query(PredictionRecord).filter(
        PredictionRecord.student_id == profile.id,
        PredictionRecord.is_active == True
    ).first()
    baseline_score = pred.risk_score if pred else 50.0
    baseline_cat = pred.risk_category if pred else "Medium"

    # Effective simulated values
    sim_gpa = req.gpa if req.gpa is not None else profile.cgpa
    sim_study = req.study_hours_per_day if req.study_hours_per_day is not None else (profile.study_hours_per_day or 2.5)
    sim_attend = req.attendance_rate if req.attendance_rate is not None else profile.attendance_rate
    sim_delay = req.assignment_delay_days if req.assignment_delay_days is not None else profile.assignment_delay_days
    sim_stress = req.stress_index if req.stress_index is not None else (profile.stress_index or 5.0)

    feature_dict = {
        "Age": profile.age,
        "Gender": profile.gender,
        "Family_Income": profile.family_income,
        "Internet_Access": profile.internet_access,
        "Study_Hours_per_Day": sim_study,
        "Attendance_Rate": sim_attend,
        "Assignment_Delay_Days": sim_delay,
        "Travel_Time_Minutes": profile.travel_time_minutes,
        "Part_Time_Job": profile.part_time_job,
        "Scholarship": profile.scholarship,
        "Stress_Index": sim_stress,
        "GPA": round((sim_gpa / 10.0) * 4.0, 3),
        "Semester_GPA": round((sim_gpa / 10.0) * 4.0, 3),
        "CGPA": round((sim_gpa / 10.0) * 4.0, 3),
        "Semester": profile.semester,
        "Department": profile.department,
        "Parental_Education": profile.parental_education
    }

    pred_res = prediction_service.predict_student_risk(feature_dict)
    sim_score = pred_res["risk_score"]
    delta = round(sim_score - baseline_score, 1)

    if sim_gpa >= 8.0:
        standing = "Distinction / Safe Standing (>= 8.0/10)"
    elif sim_gpa >= 6.0:
        standing = "Satisfactory Standing (6.0 - 7.9/10)"
    elif sim_gpa >= 5.0:
        standing = "Academic Warning (5.0 - 5.9/10, Below 6.0 Policy Threshold)"
    else:
        standing = "Critical Academic Concern (< 5.0/10)"

    drivers = []
    if req.attendance_rate is not None and abs(sim_attend - profile.attendance_rate) > 0.5:
        drivers.append({"parameter": "Attendance Rate", "change": f"{profile.attendance_rate:.1f}% -> {sim_attend:.1f}%"})
    if req.gpa is not None and abs(sim_gpa - profile.cgpa) > 0.1:
        drivers.append({"parameter": "GPA", "change": f"{profile.cgpa:.2f} -> {sim_gpa:.2f} / 10"})
    if req.assignment_delay_days is not None and sim_delay != profile.assignment_delay_days:
        drivers.append({"parameter": "Assignment Delays", "change": f"{profile.assignment_delay_days}d -> {sim_delay}d"})
    if req.study_hours_per_day is not None and abs(sim_study - (profile.study_hours_per_day or 2.5)) > 0.5:
        drivers.append({"parameter": "Study Hours", "change": f"{profile.study_hours_per_day or 2.5}h -> {sim_study}h"})

    return WhatIfSimulationResponse(
        baseline_risk_score=baseline_score,
        baseline_risk_category=baseline_cat,
        simulated_risk_score=sim_score,
        simulated_risk_category=pred_res["risk_category"],
        score_delta=delta,
        simulated_dropout_probability=pred_res["dropout_probability"],
        simulated_parameters={
            "gpa": sim_gpa,
            "study_hours_per_day": sim_study,
            "attendance_rate": sim_attend,
            "assignment_delay_days": sim_delay,
            "stress_index": sim_stress
        },
        academic_standing_tier=standing,
        top_sensitivity_drivers=drivers,
        risk_score=sim_score,
        risk_category=pred_res["risk_category"],
        dropout_probability=pred_res["dropout_probability"]
    )

