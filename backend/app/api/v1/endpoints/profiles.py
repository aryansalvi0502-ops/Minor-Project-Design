from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.prediction import PredictionRecord, PredictionExplanation
from backend.app.models.recovery import RecoveryPlan, RecoveryTask
from backend.app.models.academic_marks import SubjectAssessment
from backend.app.schemas.profile import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileOut,
    SubjectAssessmentCreate,
    SubjectAssessmentOut,
    LearningGapReportOut
)
from backend.app.services.audit_service import log_audit_event
from backend.app.services.recovery_service import recovery_service
from backend.app.services.learning_gap_service import learning_gap_service
from ml.prediction.predictor import prediction_service
from ml.prediction.explainer import explainer_service

router = APIRouter()

def _trigger_prediction_and_plan(profile: StudentProfile, db: Session):
    """
    Internal helper to generate model prediction, SHAP explanation, and personalized recovery plan
    upon profile creation or edit.
    """
    if not prediction_service.is_ready:
        return None

    def to_model_gpa(val: Optional[float]) -> float:
        if val is None:
            return 2.5
        # Proportional mapping from 10.0 scale to 4.0 scale expected by ML model
        return round(float(val / 10.0) * 4.0, 3)

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
        "GPA": to_model_gpa(profile.gpa),
        "Semester_GPA": to_model_gpa(profile.semester_gpa),
        "CGPA": to_model_gpa(profile.cgpa),
        "Semester": profile.semester,
        "Department": profile.department,
        "Parental_Education": profile.parental_education
    }

    pred_res = prediction_service.predict_student_risk(feature_dict)
    
    # Deactivate previous active predictions for this student
    db.query(PredictionRecord).filter(
        PredictionRecord.student_id == profile.id,
        PredictionRecord.is_active == True
    ).update({PredictionRecord.is_active: False})

    # Save new PredictionRecord
    pred_record = PredictionRecord(
        student_id=profile.id,
        model_version=pred_res["model_version"],
        dropout_probability=pred_res["dropout_probability"],
        risk_score=pred_res["risk_score"],
        risk_category=pred_res["risk_category"],
        threshold_used=pred_res["threshold_used"],
        input_snapshot=pred_res["features_snapshot"],
        is_active=True,
        prediction_timestamp=datetime.now(timezone.utc)
    )
    db.add(pred_record)
    db.flush()

    # Generate SHAP explanation
    explanation_res = explainer_service.explain_student(feature_dict)
    exp_record = PredictionExplanation(
        prediction_id=pred_record.id,
        base_value=explanation_res["base_value"],
        feature_contributions=explanation_res["feature_contributions"],
        summary_text=explanation_res["summary_text"]
    )
    db.add(exp_record)

    # Automatically generate or update active Recovery Plan
    plan_data = recovery_service.generate_plan_data(
        profile=profile,
        risk_category=pred_res["risk_category"],
        risk_score=pred_res["risk_score"],
        top_risk_factors=explanation_res["feature_contributions"]
    )

    # Archive previous active plans for this student
    db.query(RecoveryPlan).filter(
        RecoveryPlan.student_id == profile.id,
        RecoveryPlan.status == "active"
    ).update({RecoveryPlan.status: "archived"})

    new_plan = RecoveryPlan(
        student_id=profile.id,
        prediction_id=pred_record.id,
        created_by_user_id=profile.user_id,
        title=plan_data["title"],
        risk_level=plan_data["risk_level"],
        status="active",
        identified_areas=plan_data["identified_areas"],
        recommended_actions=plan_data["recommended_actions"],
        weekly_goals=plan_data["weekly_goals"],
        suggested_timetable=plan_data["suggested_timetable"],
        completion_rate=0.0,
        review_date=plan_data["review_date"]
    )
    db.add(new_plan)
    db.flush()

    # Add actionable tasks
    for i, t in enumerate(plan_data["tasks"]):
        task = RecoveryTask(
            plan_id=new_plan.id,
            title=t["title"],
            description=t["description"],
            category=t["category"],
            is_completed=False,
            order=i,
            target_date=datetime.now(timezone.utc) + timedelta(days=t.get("days_offset", 7))
        )
        db.add(task)

    db.commit()
    return pred_record

@router.get("/me", response_model=StudentProfileOut)
def get_my_student_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The current user account is not a student profile."
        )
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No student profile found for this account. Please complete registration onboarding."
        )
    return profile

@router.post("/", response_model=StudentProfileOut, status_code=status.HTTP_201_CREATED)
def create_student_profile(
    profile_in: StudentProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students or administrators can create student profile records."
        )

    # Check if profile already exists for this user
    target_user_id = current_user.id
    existing = db.query(StudentProfile).filter(StudentProfile.user_id == target_user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile already exists for this account. Use update endpoint instead."
        )

    # Check institutional ID uniqueness
    id_taken = db.query(StudentProfile).filter(
        StudentProfile.student_institutional_id == profile_in.student_institutional_id
    ).first()
    if id_taken:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This institutional student ID is already registered."
        )

    # Auto-assign an advisor from same department if available
    advisor = db.query(User).filter(
        User.role == "advisor",
        User.department == profile_in.department,
        User.is_active == True
    ).first()
    if not advisor:
        # Fallback to any active advisor
        advisor = db.query(User).filter(User.role == "advisor", User.is_active == True).first()

    profile = StudentProfile(
        user_id=target_user_id,
        student_institutional_id=profile_in.student_institutional_id,
        department=profile_in.department,
        semester=profile_in.semester,
        age=profile_in.age,
        gender=profile_in.gender,
        family_income=profile_in.family_income,
        internet_access=profile_in.internet_access,
        study_hours_per_day=profile_in.study_hours_per_day,
        attendance_rate=profile_in.attendance_rate,
        assignment_delay_days=profile_in.assignment_delay_days,
        travel_time_minutes=profile_in.travel_time_minutes,
        part_time_job=profile_in.part_time_job,
        scholarship=profile_in.scholarship,
        stress_index=profile_in.stress_index,
        gpa=profile_in.gpa,
        semester_gpa=profile_in.semester_gpa,
        cgpa=profile_in.cgpa,
        parental_education=profile_in.parental_education,
        institution=profile_in.institution or "MITAOE",
        degree_program=profile_in.degree_program or "Computer Engineering",
        admission_batch=profile_in.admission_batch or "2023-2027",
        curriculum_version=profile_in.curriculum_version or "Autonomous 2022",
        assigned_advisor_id=advisor.id if advisor else None,
        last_profile_update=datetime.now(timezone.utc)
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    # Trigger automatic prediction and recovery plan creation
    _trigger_prediction_and_plan(profile, db)
    db.refresh(profile)

    log_audit_event(
        db=db,
        action="STUDENT_PROFILE_CREATED",
        resource_type="student_profile",
        resource_id=str(profile.id),
        user_id=current_user.id,
        details={"institutional_id": profile.student_institutional_id, "department": profile.department}
    )

    return profile

@router.put("/me", response_model=StudentProfileOut)
def update_my_student_profile(
    profile_update: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for current user."
        )

    # Apply updates
    update_data = profile_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)
    
    profile.last_profile_update = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)

    # Re-evaluate prediction and update recovery plan
    _trigger_prediction_and_plan(profile, db)
    db.refresh(profile)

    log_audit_event(
        db=db,
        action="STUDENT_PROFILE_UPDATED",
        resource_type="student_profile",
        resource_id=str(profile.id),
        user_id=current_user.id,
        details={"updated_fields": list(update_data.keys())}
    )

    return profile

@router.get("/{profile_id}", response_model=StudentProfileOut)
def get_student_profile_by_id(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enforces server-side authorization:
    - Students can only view their own profile.
    - Advisors can only view students assigned to them.
    - Management cannot browse individual student records without explicit permission.
    - Admin can view any profile.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    # Authorization Check
    if current_user.role == "student":
        if profile.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Students can only access their own profile."
            )
    elif current_user.role == "advisor":
        if profile.assigned_advisor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are only authorized to review students assigned to your advisement cohort."
            )
    elif current_user.role == "management":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Management role has aggregate de-identified access and cannot inspect individual student records."
        )

    log_audit_event(
        db=db,
        action="STUDENT_RECORD_ACCESSED",
        resource_type="student_profile",
        resource_id=str(profile.id),
        user_id=current_user.id,
        details={"viewer_role": current_user.role}
    )

    return profile

@router.get("/me/learning-gaps", response_model=LearningGapReportOut)
def get_my_learning_gaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Performs learning-gap analysis on actual subject-level marks and assessments
    for the current authenticated student.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Learning-gap analysis is tailored for student accounts."
        )

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    assessments = db.query(SubjectAssessment).filter(
        SubjectAssessment.student_id == profile.id
    ).order_by(SubjectAssessment.assessed_date.desc()).all()

    from backend.app.models.curriculum import StudentCourseEnrollment
    enrollments = db.query(StudentCourseEnrollment).filter(
        StudentCourseEnrollment.student_id == profile.id,
        StudentCourseEnrollment.is_confirmed == True
    ).all()

    return learning_gap_service.analyze_student_gaps(assessments, enrollments=enrollments)

@router.get("/me/subject-marks", response_model=List[SubjectAssessmentOut])
def get_my_subject_marks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all subject assessment marks recorded for the current student.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    assessments = db.query(SubjectAssessment).filter(
        SubjectAssessment.student_id == profile.id
    ).order_by(SubjectAssessment.assessed_date.desc()).all()

    results = []
    for a in assessments:
        pct = (a.obtained_score / a.max_score) * 100.0 if a.max_score > 0 else 0.0
        results.append(SubjectAssessmentOut(
            id=a.id,
            student_id=a.student_id,
            subject_code=a.subject_code,
            subject_name=a.subject_name,
            assessment_type=a.assessment_type,
            obtained_score=a.obtained_score,
            max_score=a.max_score,
            percentage=round(pct, 1),
            weight_percentage=a.weight_percentage,
            topic_breakdown=a.topic_breakdown,
            assessed_date=a.assessed_date
        ))
    return results

@router.post("/me/subject-marks", response_model=SubjectAssessmentOut, status_code=status.HTTP_201_CREATED)
def add_subject_mark(
    assessment_in: SubjectAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logs a new subject assessment or exam score for the student.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    topics_json = [t.model_dump() for t in assessment_in.topic_breakdown] if assessment_in.topic_breakdown else []
    record = SubjectAssessment(
        student_id=profile.id,
        subject_code=assessment_in.subject_code,
        subject_name=assessment_in.subject_name,
        assessment_type=assessment_in.assessment_type,
        obtained_score=assessment_in.obtained_score,
        max_score=assessment_in.max_score,
        weight_percentage=assessment_in.weight_percentage,
        topic_breakdown=topics_json,
        assessed_date=datetime.now(timezone.utc)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    log_audit_event(
        db=db,
        action="SUBJECT_ASSESSMENT_ADDED",
        resource_type="subject_assessment",
        resource_id=str(record.id),
        user_id=current_user.id,
        details={"subject_code": record.subject_code, "score": record.obtained_score}
    )

    pct = (record.obtained_score / record.max_score) * 100.0 if record.max_score > 0 else 0.0
    return SubjectAssessmentOut(
        id=record.id,
        student_id=record.student_id,
        subject_code=record.subject_code,
        subject_name=record.subject_name,
        assessment_type=record.assessment_type,
        obtained_score=record.obtained_score,
        max_score=record.max_score,
        percentage=round(pct, 1),
        weight_percentage=record.weight_percentage,
        topic_breakdown=record.topic_breakdown,
        assessed_date=record.assessed_date
    )

