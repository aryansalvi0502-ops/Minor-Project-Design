from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_role
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.prediction import PredictionRecord
from backend.app.models.advisor import AdvisorIntervention
from backend.app.models.notification import InAppNotification
from backend.app.models.academic_marks import SubjectAssessment
from backend.app.models.feedback import SupportFeedback
from backend.app.schemas.advisor import (
    AssignedStudentItem,
    InterventionRequest,
    InterventionUpdate,
    InterventionOut,
    AppointmentConfirmRequest,
    AppointmentCompleteRequest
)
from backend.app.schemas.profile import LearningGapReportOut
from backend.app.services.learning_gap_service import learning_gap_service
from backend.app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("/assigned-students", response_model=List[AssignedStudentItem])
def get_assigned_students(
    search: Optional[str] = None,
    risk_category: Optional[str] = None,
    gpa_tier: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[str] = None,
    sort_by: str = Query("risk_score", pattern="^(risk_score|attendance_rate|gpa|student_institutional_id)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(require_role(["advisor", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Returns students assigned to the calling advisor (or all students for admin).
    Supports searching by name/ID, filtering by risk level/department/semester, and sorting.
    """
    query = db.query(StudentProfile).join(User, StudentProfile.user_id == User.id)

    # Advisor isolation: Advisors can only view assigned students
    if current_user.role == "advisor":
        query = query.filter(StudentProfile.assigned_advisor_id == current_user.id)

    if department:
        query = query.filter(StudentProfile.department == department)
    if semester:
        query = query.filter(StudentProfile.semester == semester)
    if search:
        search_filter = or_(
            User.full_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
            StudentProfile.student_institutional_id.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    profiles = query.all()

    # Build student items with active prediction metrics
    results = []
    for p in profiles:
        active_pred = db.query(PredictionRecord).filter(
            PredictionRecord.student_id == p.id,
            PredictionRecord.is_active == True
        ).first()

        active_plan_id = None
        if p.recovery_plans:
            for plan in p.recovery_plans:
                if plan.status in ["active", "in_progress"]:
                    active_plan_id = plan.id
                    break

        last_intervention = db.query(AdvisorIntervention).filter(
            AdvisorIntervention.student_id == p.id
        ).order_by(AdvisorIntervention.created_at.desc()).first()

        item = AssignedStudentItem(
            student_profile_id=p.id,
            student_institutional_id=p.student_institutional_id,
            full_name=p.user.full_name if (p.user and p.user.full_name) else "Student",
            email=p.user.email if (p.user and p.user.email) else "N/A",
            department=p.department,
            semester=p.semester,
            attendance_rate=p.attendance_rate,
            gpa=p.gpa,
            cgpa=p.cgpa,
            risk_score=active_pred.risk_score if active_pred else None,
            risk_category=active_pred.risk_category if active_pred else "Unassessed",
            last_prediction_date=active_pred.prediction_timestamp if active_pred else None,
            active_recovery_plan_id=active_plan_id,
            intervention_status=last_intervention.status if last_intervention else None
        )

        # Apply risk_category filter
        if risk_category and item.risk_category != risk_category:
            continue

        # Apply gpa_tier filter based on 10-point scale thresholds
        if gpa_tier and gpa_tier != "all":
            eff_gpa = p.cgpa if p.cgpa > 4.0 else (p.cgpa / 4.0 * 10.0)
            if gpa_tier == "below_threshold" and eff_gpa >= 6.0:
                continue
            elif gpa_tier == "critical" and eff_gpa >= 5.0:
                continue
            elif gpa_tier == "average" and (eff_gpa < 6.0 or eff_gpa >= 8.0):
                continue
            elif gpa_tier == "high" and eff_gpa < 8.0:
                continue

        results.append(item)

    # In-memory sort based on selected parameter
    reverse = (sort_order == "desc")
    if sort_by == "risk_score":
        results.sort(key=lambda x: (x.risk_score is not None, x.risk_score or 0), reverse=reverse)
    elif sort_by == "attendance_rate":
        results.sort(key=lambda x: x.attendance_rate, reverse=reverse)
    elif sort_by == "gpa":
        results.sort(key=lambda x: x.gpa, reverse=reverse)
    elif sort_by == "student_institutional_id":
        results.sort(key=lambda x: x.student_institutional_id, reverse=reverse)

    return results

@router.post("/interventions", response_model=InterventionOut, status_code=status.HTTP_201_CREATED)
def create_intervention(
    req: InterventionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.id == req.student_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    # Authorization
    if current_user.role == "student":
        if profile.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        advisor_id = profile.assigned_advisor_id or current_user.id
        status_val = "requested_by_student"
    elif current_user.role == "advisor":
        if profile.assigned_advisor_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student not assigned to you.")
        advisor_id = current_user.id
        status_val = "scheduled"
    elif current_user.role == "admin":
        advisor_id = profile.assigned_advisor_id or current_user.id
        status_val = "scheduled"
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    intervention = AdvisorIntervention(
        advisor_id=advisor_id,
        student_id=profile.id,
        intervention_type=req.intervention_type,
        status=status_val,
        meeting_date=req.meeting_date,
        student_request_notes=req.student_request_notes,
        advisor_notes=req.advisor_notes if current_user.role in ["advisor", "admin"] else None,
        action_taken=req.action_taken if current_user.role in ["advisor", "admin"] else None
    )
    db.add(intervention)
    db.flush()

    # Create in-app notification for the counterparty
    if current_user.role == "student" and profile.assigned_advisor_id:
        notif = InAppNotification(
            user_id=profile.assigned_advisor_id,
            title="New Student Support Request",
            message=f"{current_user.full_name} has requested an advisor check-in for {req.intervention_type}.",
            type="meeting",
            action_url=f"/advisor/students/{profile.id}"
        )
        db.add(notif)
    elif current_user.role in ["advisor", "admin"]:
        notif = InAppNotification(
            user_id=profile.user_id,
            title="Advisor Support Scheduled",
            message=f"An advisor follow-up for '{req.intervention_type}' has been scheduled.",
            type="meeting",
            action_url="/recovery-plan"
        )
        db.add(notif)

    db.commit()
    db.refresh(intervention)

    log_audit_event(
        db=db,
        action="INTERVENTION_CREATED",
        resource_type="intervention",
        resource_id=str(intervention.id),
        user_id=current_user.id,
        details={"type": intervention.intervention_type, "status": intervention.status}
    )

    return intervention

@router.put("/interventions/{intervention_id}", response_model=InterventionOut)
def update_intervention(
    intervention_id: int,
    update_in: InterventionUpdate,
    current_user: User = Depends(require_role(["advisor", "admin"])),
    db: Session = Depends(get_db)
):
    intervention = db.query(AdvisorIntervention).filter(AdvisorIntervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intervention record not found.")

    if current_user.role == "advisor" and intervention.advisor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this intervention record.")

    if update_in.status:
        intervention.status = update_in.status
    if update_in.meeting_date is not None:
        intervention.meeting_date = update_in.meeting_date
    if update_in.advisor_notes is not None:
        intervention.advisor_notes = update_in.advisor_notes
    if update_in.action_taken is not None:
        intervention.action_taken = update_in.action_taken

    intervention.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(intervention)

    log_audit_event(
        db=db,
        action="INTERVENTION_UPDATED",
        resource_type="intervention",
        resource_id=str(intervention.id),
        user_id=current_user.id,
        details={"status": intervention.status}
    )

    return intervention

@router.get("/interventions", response_model=List[InterventionOut])
def list_my_interventions(
    student_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "student":
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if not profile:
            return []
        interventions = db.query(AdvisorIntervention).filter(
            AdvisorIntervention.student_id == profile.id
        ).order_by(AdvisorIntervention.created_at.desc()).all()

        # Sanitize staff-only notes for student response
        sanitized = []
        for i in interventions:
            sanitized.append(InterventionOut(
                id=i.id,
                advisor_id=i.advisor_id,
                student_id=i.student_id,
                intervention_type=i.intervention_type,
                status=i.status,
                meeting_date=i.meeting_date,
                student_request_notes=i.student_request_notes,
                advisor_notes=None, # Strictly hidden from student
                action_taken=i.action_taken,
                created_at=i.created_at,
                updated_at=i.updated_at
            ))
        return sanitized
    elif current_user.role in ["advisor", "admin"]:
        query = db.query(AdvisorIntervention)
        if current_user.role == "advisor":
            query = query.filter(AdvisorIntervention.advisor_id == current_user.id)
        if student_id:
            query = query.filter(AdvisorIntervention.student_id == student_id)
        return query.order_by(AdvisorIntervention.created_at.desc()).all()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

@router.get("/students/{student_profile_id}/learning-gaps", response_model=LearningGapReportOut)
def get_student_learning_gaps_for_advisor(
    student_profile_id: int,
    current_user: User = Depends(require_role(["advisor", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Allows faculty advisors to review empirical learning gaps and concept deficits
    for a student assigned to their cohort.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    if current_user.role == "advisor" and profile.assigned_advisor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Student is not assigned to your advising cohort.")

    assessments = db.query(SubjectAssessment).filter(
        SubjectAssessment.student_id == profile.id
    ).order_by(SubjectAssessment.assessed_date.desc()).all()

    return learning_gap_service.analyze_student_gaps(assessments)

@router.patch("/appointments/{intervention_id}/confirm", response_model=InterventionOut)
def confirm_advisor_appointment(
    intervention_id: int,
    confirm_in: AppointmentConfirmRequest,
    current_user: User = Depends(require_role(["advisor", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Advisor confirms a student's requested appointment, providing the verified
    meeting date, room location or virtual consultation link.
    """
    intervention = db.query(AdvisorIntervention).filter(AdvisorIntervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Appointment request not found.")

    if current_user.role == "advisor" and intervention.advisor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only confirm appointments assigned to you.")

    intervention.status = "scheduled"
    intervention.meeting_date = confirm_in.meeting_date
    intervention.meeting_link_or_location = confirm_in.meeting_link_or_location
    if confirm_in.advisor_notes:
        intervention.advisor_notes = confirm_in.advisor_notes
    intervention.updated_at = datetime.now(timezone.utc)

    # Notify student
    student_profile = db.query(StudentProfile).filter(StudentProfile.id == intervention.student_id).first()
    if student_profile:
        notif = InAppNotification(
            user_id=student_profile.user_id,
            title=f"Appointment Confirmed: {intervention.intervention_type}",
            message=f"{current_user.full_name} confirmed your consultation for {confirm_in.meeting_date.strftime('%b %d at %I:%M %p')}. Location: {confirm_in.meeting_link_or_location}",
            type="meeting",
            action_url="/support"
        )
        db.add(notif)

    db.commit()
    db.refresh(intervention)

    adv = db.query(User).filter(User.id == intervention.advisor_id).first()
    stu = student_profile.user if student_profile else None

    return InterventionOut(
        id=intervention.id,
        advisor_id=intervention.advisor_id,
        student_id=intervention.student_id,
        intervention_type=intervention.intervention_type,
        status=intervention.status,
        urgency=intervention.urgency,
        modality=intervention.modality,
        meeting_date=intervention.meeting_date,
        meeting_link_or_location=intervention.meeting_link_or_location,
        student_request_notes=intervention.student_request_notes,
        advisor_notes=intervention.advisor_notes,
        action_taken=intervention.action_taken,
        follow_up_notes=intervention.follow_up_notes,
        follow_up_tasks=intervention.follow_up_tasks,
        advisor_name=adv.full_name if adv else "Advisor",
        student_name=stu.full_name if stu else "Student",
        created_at=intervention.created_at,
        updated_at=intervention.updated_at
    )

@router.patch("/appointments/{intervention_id}/complete", response_model=InterventionOut)
def complete_advisor_appointment(
    intervention_id: int,
    complete_in: AppointmentCompleteRequest,
    current_user: User = Depends(require_role(["advisor", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Advisor concludes the appointment, documenting actions taken, recovery
    recommendations, and follow-up guidance for the student.
    """
    intervention = db.query(AdvisorIntervention).filter(AdvisorIntervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if current_user.role == "advisor" and intervention.advisor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only complete appointments assigned to you.")

    intervention.status = "completed"
    intervention.action_taken = complete_in.action_taken
    intervention.follow_up_notes = complete_in.follow_up_notes
    intervention.follow_up_tasks = complete_in.follow_up_tasks
    intervention.updated_at = datetime.now(timezone.utc)

    # Notify student with follow-up guidance
    student_profile = db.query(StudentProfile).filter(StudentProfile.id == intervention.student_id).first()
    if student_profile:
        notif = InAppNotification(
            user_id=student_profile.user_id,
            title=f"Advisor Follow-up Notes: {intervention.intervention_type}",
            message=f"{current_user.full_name} logged post-session guidance: {complete_in.action_taken[:100]}...",
            type="meeting",
            action_url="/support"
        )
        db.add(notif)

    db.commit()
    db.refresh(intervention)

    adv = db.query(User).filter(User.id == intervention.advisor_id).first()
    stu = student_profile.user if student_profile else None

    return InterventionOut(
        id=intervention.id,
        advisor_id=intervention.advisor_id,
        student_id=intervention.student_id,
        intervention_type=intervention.intervention_type,
        status=intervention.status,
        urgency=intervention.urgency,
        modality=intervention.modality,
        meeting_date=intervention.meeting_date,
        meeting_link_or_location=intervention.meeting_link_or_location,
        student_request_notes=intervention.student_request_notes,
        advisor_notes=intervention.advisor_notes,
        action_taken=intervention.action_taken,
        follow_up_notes=intervention.follow_up_notes,
        follow_up_tasks=intervention.follow_up_tasks,
        advisor_name=adv.full_name if adv else "Advisor",
        student_name=stu.full_name if stu else "Student",
        created_at=intervention.created_at,
        updated_at=intervention.updated_at
    )

@router.get("/feedback-summary")
def get_advisor_feedback_summary(
    current_user: User = Depends(require_role(["advisor", "admin", "management"])),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated feedback metrics on support effectiveness,
    advisor meetings, and recovery plans.
    """
    feedbacks = db.query(SupportFeedback).all()
    if not feedbacks:
        return {
            "total_reviews": 0,
            "average_rating": 5.0,
            "effectiveness_breakdown": {"Highly Effective": 0, "Somewhat Helpful": 0, "Needs Improvement": 0},
            "recent_feedback": []
        }

    total = len(feedbacks)
    avg_rating = sum(f.rating for f in feedbacks) / total
    breakdown = {"Highly Effective": 0, "Somewhat Helpful": 0, "Needs Improvement": 0}
    for f in feedbacks:
        eff = f.effectiveness or "Somewhat Helpful"
        breakdown[eff] = breakdown.get(eff, 0) + 1

    recent = [
        {
            "id": f.id,
            "type": f.feedback_type,
            "target_title": f.target_title,
            "rating": f.rating,
            "effectiveness": f.effectiveness,
            "comments": f.comments,
            "date": f.created_at.strftime("%Y-%m-%d")
        }
        for f in feedbacks[-10:]
    ]

    return {
        "total_reviews": total,
        "average_rating": round(avg_rating, 2),
        "effectiveness_breakdown": breakdown,
        "recent_feedback": recent
    }


