from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.recovery import RecoveryPlan, RecoveryTask
from backend.app.models.timetable import StudentTimetableConfig, StudentDeadline
from backend.app.models.learning_resources import LearningResource
from backend.app.schemas.recovery import (
    RecoveryPlanOut,
    RecoveryTaskToggle,
    RecoveryPlanCustomUpdate,
    PrioritizedActionsOut,
    TaskToggleResult,
    TimetableConfigOut,
    TimetableConfigUpdate,
    StudentDeadlineCreate,
    StudentDeadlineOut,
    LearningResourceOut,
    MilestoneCelebration
)
from backend.app.services.audit_service import log_audit_event
from backend.app.services.prioritized_actions_service import prioritized_actions_service
from backend.app.services.timetable_service import timetable_service

router = APIRouter()

# --- 1. Top Prioritized Next Actions ---

@router.get("/prioritized-actions", response_model=PrioritizedActionsOut)
def get_prioritized_actions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes three prioritized next actions tailored to the student's actual marks,
    learning gaps, attendance deficit, deadlines, and active recovery roadmap.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prioritized next actions are tailored for student self-service."
        )

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    return prioritized_actions_service.compute_top_three_actions(profile, db)

# --- 2. Active Recovery Plan & Milestone Feedback ---

@router.get("/current", response_model=RecoveryPlanOut)
def get_my_active_recovery_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    plan = db.query(RecoveryPlan).filter(
        RecoveryPlan.student_id == profile.id,
        RecoveryPlan.status == "active"
    ).order_by(RecoveryPlan.created_at.desc()).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active recovery plan found. Please generate a prediction from your profile first."
        )

    return plan

@router.put("/tasks/{task_id}/toggle", response_model=RecoveryPlanOut)
def toggle_recovery_task(
    task_id: int,
    toggle_in: RecoveryTaskToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggles completion of a recovery task, recalculates progress rate,
    updates completion streaks, and unlocks celebratory milestone badges.
    """
    task = db.query(RecoveryTask).filter(RecoveryTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery task not found.")

    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == task.plan_id).first()
    profile = db.query(StudentProfile).filter(StudentProfile.id == plan.student_id).first()

    # Authorization
    if current_user.role == "student" and profile.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif current_user.role == "advisor" and profile.assigned_advisor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    task.is_completed = toggle_in.is_completed
    task.completed_at = datetime.now(timezone.utc) if toggle_in.is_completed else None

    # Recalculate plan completion percentage & streaks
    all_tasks = db.query(RecoveryTask).filter(RecoveryTask.plan_id == plan.id).all()
    if all_tasks:
        completed_count = sum(1 for t in all_tasks if t.is_completed)
        plan.completion_rate = round((completed_count / len(all_tasks)) * 100.0, 1)
        if plan.completion_rate >= 100.0:
            plan.status = "completed"
        elif plan.completion_rate > 0.0:
            plan.status = "in_progress"
        else:
            plan.status = "active"

        # Update streak
        if toggle_in.is_completed:
            plan.streak_count = (plan.streak_count or 0) + 1
        else:
            plan.streak_count = max(0, (plan.streak_count or 1) - 1)

        # Milestone badges detection
        badges = list(plan.milestone_badges or [])
        if plan.completion_rate >= 25.0 and "25%_starter" not in badges:
            badges.append("25%_starter")
        if plan.completion_rate >= 50.0 and "50%_halfway" not in badges:
            badges.append("50%_halfway")
        if plan.completion_rate >= 75.0 and "75%_scholar" not in badges:
            badges.append("75%_scholar")
        if plan.completion_rate >= 100.0 and "100%_mastery" not in badges:
            badges.append("100%_mastery")
        plan.milestone_badges = badges

    db.commit()
    db.refresh(plan)

    log_audit_event(
        db=db,
        action="RECOVERY_TASK_TOGGLED",
        resource_type="recovery_task",
        resource_id=str(task.id),
        user_id=current_user.id,
        details={"is_completed": task.is_completed, "plan_completion_rate": plan.completion_rate}
    )

    return plan

# --- 3. Adaptive Timetable & Deadlines ---

@router.get("/timetable", response_model=TimetableConfigOut)
def get_adaptive_timetable(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns student availability, class hours, upcoming deadlines, and dynamically
    generated adaptive study timetable.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    cfg = db.query(StudentTimetableConfig).filter(StudentTimetableConfig.student_id == profile.id).first()
    deadlines = db.query(StudentDeadline).filter(StudentDeadline.student_id == profile.id).order_by(StudentDeadline.due_date.asc()).all()
    deadlines_json = [
        {
            "id": d.id,
            "title": d.title,
            "subject_code": d.subject_code,
            "deadline_type": d.deadline_type,
            "due_date": d.due_date.isoformat(),
            "estimated_hours_needed": d.estimated_hours_needed,
            "is_completed": d.is_completed
        }
        for d in deadlines
    ]

    if not cfg:
        # Fetch confirmed enrolled courses & weak subjects
        from backend.app.models.academic_marks import SubjectAssessment
        from backend.app.models.curriculum import StudentCourseEnrollment

        enrollments = db.query(StudentCourseEnrollment).filter(
            StudentCourseEnrollment.student_id == profile.id,
            StudentCourseEnrollment.is_confirmed == True
        ).all()
        enrolled_codes = [e.course_code for e in enrollments]

        weak_subs = []
        for e in enrollments:
            if e.confidence_level == "Low" and e.course_code not in weak_subs:
                weak_subs.append(e.course_code)

        assessments = db.query(SubjectAssessment).filter(SubjectAssessment.student_id == profile.id).all()
        for a in assessments:
            pct = (a.obtained_score / a.max_score) * 100.0 if a.max_score > 0 else 0.0
            if pct < 65.0 and a.subject_code not in weak_subs:
                weak_subs.append(a.subject_code)

        # Generate default config with MITAOE courses
        adaptive_sched = timetable_service.generate_adaptive_schedule(
            class_schedule=[],
            blocked_slots=[],
            daily_study_goal_hours=profile.study_hours_per_day or 3.0,
            preferred_window="Evening",
            weak_subjects=weak_subs,
            deadlines=deadlines_json,
            enrolled_subjects=enrolled_codes
        )
        cfg = StudentTimetableConfig(
            student_id=profile.id,
            daily_study_goal_hours=profile.study_hours_per_day or 3.0,
            preferred_study_window="Evening",
            blocked_slots=[],
            class_schedule=[],
            generated_timetable=adaptive_sched
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)

    return TimetableConfigOut(
        student_id=cfg.student_id,
        daily_study_goal_hours=cfg.daily_study_goal_hours,
        preferred_study_window=cfg.preferred_study_window,
        blocked_slots=cfg.blocked_slots or [],
        class_schedule=cfg.class_schedule or [],
        generated_timetable=cfg.generated_timetable or {},
        deadlines=deadlines_json,
        updated_at=cfg.updated_at
    )

@router.put("/timetable/config", response_model=TimetableConfigOut)
def update_timetable_config(
    cfg_in: TimetableConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates student availability preferences, class lecture hours, or blocked shifts,
    and dynamically recalculates the adaptive weekly study schedule.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    cfg = db.query(StudentTimetableConfig).filter(StudentTimetableConfig.student_id == profile.id).first()
    if not cfg:
        cfg = StudentTimetableConfig(student_id=profile.id)
        db.add(cfg)

    if cfg_in.daily_study_goal_hours is not None:
        cfg.daily_study_goal_hours = cfg_in.daily_study_goal_hours
    if cfg_in.preferred_study_window is not None:
        cfg.preferred_study_window = cfg_in.preferred_study_window
    if cfg_in.blocked_slots is not None:
        cfg.blocked_slots = [b.model_dump() for b in cfg_in.blocked_slots]
    if cfg_in.class_schedule is not None:
        cfg.class_schedule = [c.model_dump() for c in cfg_in.class_schedule]

    # Fetch active uncompleted deadlines
    deadlines = db.query(StudentDeadline).filter(
        StudentDeadline.student_id == profile.id,
        StudentDeadline.is_completed == False
    ).all()
    deadlines_dict = [{"subject_code": d.subject_code, "title": d.title} for d in deadlines]

    # Identify weak subjects from assessments and confidence ratings
    from backend.app.models.academic_marks import SubjectAssessment
    from backend.app.models.curriculum import StudentCourseEnrollment

    enrollments = db.query(StudentCourseEnrollment).filter(
        StudentCourseEnrollment.student_id == profile.id,
        StudentCourseEnrollment.is_confirmed == True
    ).all()
    enrolled_codes = [e.course_code for e in enrollments]

    weak_subs = []
    for e in enrollments:
        if e.confidence_level == "Low" and e.course_code not in weak_subs:
            weak_subs.append(e.course_code)

    assessments = db.query(SubjectAssessment).filter(SubjectAssessment.student_id == profile.id).all()
    for a in assessments:
        pct = (a.obtained_score / a.max_score) * 100.0 if a.max_score > 0 else 0.0
        if pct < 65.0 and a.subject_code not in weak_subs:
            weak_subs.append(a.subject_code)

    # Re-generate adaptive schedule
    new_timetable = timetable_service.generate_adaptive_schedule(
        class_schedule=cfg.class_schedule or [],
        blocked_slots=cfg.blocked_slots or [],
        daily_study_goal_hours=cfg.daily_study_goal_hours,
        preferred_window=cfg.preferred_study_window,
        weak_subjects=weak_subs,
        deadlines=deadlines_dict,
        enrolled_subjects=enrolled_codes
    )
    cfg.generated_timetable = new_timetable
    cfg.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cfg)

    all_deadlines = db.query(StudentDeadline).filter(StudentDeadline.student_id == profile.id).order_by(StudentDeadline.due_date.asc()).all()
    deadlines_json = [
        {
            "id": d.id,
            "title": d.title,
            "subject_code": d.subject_code,
            "deadline_type": d.deadline_type,
            "due_date": d.due_date.isoformat(),
            "estimated_hours_needed": d.estimated_hours_needed,
            "is_completed": d.is_completed
        }
        for d in all_deadlines
    ]

    return TimetableConfigOut(
        student_id=cfg.student_id,
        daily_study_goal_hours=cfg.daily_study_goal_hours,
        preferred_study_window=cfg.preferred_study_window,
        blocked_slots=cfg.blocked_slots or [],
        class_schedule=cfg.class_schedule or [],
        generated_timetable=cfg.generated_timetable or {},
        deadlines=deadlines_json,
        updated_at=cfg.updated_at
    )

@router.post("/timetable/deadlines", response_model=StudentDeadlineOut, status_code=status.HTTP_201_CREATED)
def add_student_deadline(
    deadline_in: StudentDeadlineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Adds a new assignment or exam deadline, automatically weaving dedicated
    milestone study sprints into the student's adaptive timetable.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    dl = StudentDeadline(
        student_id=profile.id,
        title=deadline_in.title,
        subject_code=deadline_in.subject_code,
        deadline_type=deadline_in.deadline_type,
        due_date=deadline_in.due_date,
        estimated_hours_needed=deadline_in.estimated_hours_needed,
        is_completed=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(dl)
    db.commit()
    db.refresh(dl)

    # Re-sync adaptive schedule
    cfg = db.query(StudentTimetableConfig).filter(StudentTimetableConfig.student_id == profile.id).first()
    if cfg:
        all_active_dl = db.query(StudentDeadline).filter(StudentDeadline.student_id == profile.id, StudentDeadline.is_completed == False).all()
        deadlines_dict = [{"subject_code": d.subject_code, "title": d.title} for d in all_active_dl]
        cfg.generated_timetable = timetable_service.generate_adaptive_schedule(
            class_schedule=cfg.class_schedule or [],
            blocked_slots=cfg.blocked_slots or [],
            daily_study_goal_hours=cfg.daily_study_goal_hours,
            preferred_window=cfg.preferred_study_window,
            deadlines=deadlines_dict
        )
        db.commit()

    return dl

@router.patch("/timetable/deadlines/{deadline_id}/toggle", response_model=StudentDeadlineOut)
def toggle_deadline_completion(
    deadline_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dl = db.query(StudentDeadline).filter(StudentDeadline.id == deadline_id).first()
    if not dl:
        raise HTTPException(status_code=404, detail="Deadline record not found.")

    profile = db.query(StudentProfile).filter(StudentProfile.id == dl.student_id).first()
    if profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    dl.is_completed = not dl.is_completed
    db.commit()
    db.refresh(dl)
    return dl

@router.delete("/timetable/deadlines/{deadline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student_deadline(
    deadline_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dl = db.query(StudentDeadline).filter(StudentDeadline.id == deadline_id).first()
    if not dl:
        raise HTTPException(status_code=404, detail="Deadline record not found.")

    profile = db.query(StudentProfile).filter(StudentProfile.id == dl.student_id).first()
    if profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    db.delete(dl)
    db.commit()
    return None

# --- 4. Verified Learning Resource Recommendations ---

@router.get("/resources", response_model=List[LearningResourceOut])
def get_verified_learning_resources(
    department: Optional[str] = None,
    subject_code: Optional[str] = None,
    category: Optional[str] = None,
    query: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns curated, verified open-access educational resources matched
    to student course topics, departments, or search queries.
    """
    q = db.query(LearningResource).filter(LearningResource.is_verified == True)

    # If department not provided and user is student, prioritize student's department
    if not department and current_user.role == "student":
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if profile and profile.department:
            q = q.filter((LearningResource.department == profile.department) | (LearningResource.department == "General"))
    elif department:
        q = q.filter(LearningResource.department == department)

    if subject_code:
        q = q.filter(LearningResource.subject_code == subject_code)
    if category:
        q = q.filter(LearningResource.category == category)
    if query:
        search_filter = f"%{query}%"
        q = q.filter(
            (LearningResource.title.ilike(search_filter)) |
            (LearningResource.description.ilike(search_filter)) |
            (LearningResource.concept_tag.ilike(search_filter))
        )

    return q.order_by(LearningResource.rating.desc()).all()

# --- 5. Advisor & Legacy Support ---

@router.get("/student/{student_profile_id}", response_model=RecoveryPlanOut)
def get_student_recovery_plan_authorized(
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif current_user.role == "management":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    plan = db.query(RecoveryPlan).filter(
        RecoveryPlan.student_id == profile.id,
        RecoveryPlan.status.in_(["active", "in_progress"])
    ).order_by(RecoveryPlan.created_at.desc()).first()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active plan found for this student.")

    return plan
