from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.curriculum import InstitutionProgram, OfficialCourse, StudentCourseEnrollment
from backend.app.schemas.curriculum import (
    InstitutionProgramOut,
    OfficialCourseOut,
    StudentCourseEnrollmentCreate,
    StudentCourseEnrollmentUpdate,
    StudentCourseEnrollmentOut,
    CourseImportRequest,
    CourseImportResponse
)
from backend.app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("/programs", response_model=List[InstitutionProgramOut])
def get_institution_programs(db: Session = Depends(get_db)):
    """
    List all active academic degree programs offered at MITAOE.
    """
    return db.query(InstitutionProgram).filter(
        InstitutionProgram.institution == "MITAOE",
        InstitutionProgram.is_active == True
    ).order_by(InstitutionProgram.program_name).all()

@router.get("/courses", response_model=List[OfficialCourseOut])
def get_official_courses(
    program_id: Optional[int] = None,
    program_name: Optional[str] = None,
    semester: Optional[int] = None,
    curriculum_version: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve verified official MITAOE courses filtered by degree program, semester, and curriculum version.
    """
    query = db.query(OfficialCourse).filter(OfficialCourse.institution == "MITAOE")
    
    if program_id:
        query = query.filter(OfficialCourse.program_id == program_id)
    elif program_name:
        prog = db.query(InstitutionProgram).filter(
            InstitutionProgram.program_name.ilike(f"%{program_name}%")
        ).first()
        if prog:
            query = query.filter(OfficialCourse.program_id == prog.id)
            
    if semester:
        query = query.filter(OfficialCourse.semester == semester)
    if curriculum_version:
        query = query.filter(OfficialCourse.curriculum_version == curriculum_version)
        
    return query.order_by(OfficialCourse.semester, OfficialCourse.course_code).all()

@router.get("/my-enrollments", response_model=List[StudentCourseEnrollmentOut])
def get_my_course_enrollments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve the authenticated student's verified and confirmed enrolled courses.
    Enforces student record ownership.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please complete initial academic setup."
        )
    return db.query(StudentCourseEnrollment).filter(
        StudentCourseEnrollment.student_id == profile.id
    ).order_by(StudentCourseEnrollment.semester, StudentCourseEnrollment.course_code).all()

@router.post("/my-enrollments", response_model=StudentCourseEnrollmentOut, status_code=status.HTTP_201_CREATED)
def add_my_course_enrollment(
    enroll_in: StudentCourseEnrollmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enroll or confirm an official MITAOE course or elective for the authenticated student.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    # Check if already enrolled in this course for this semester
    existing = db.query(StudentCourseEnrollment).filter(
        StudentCourseEnrollment.student_id == profile.id,
        StudentCourseEnrollment.course_code == enroll_in.course_code,
        StudentCourseEnrollment.semester == enroll_in.semester
    ).first()
    if existing:
        existing.confidence_level = enroll_in.confidence_level
        existing.difficult_topics = enroll_in.difficult_topics or []
        existing.academic_goal = enroll_in.academic_goal
        existing.is_confirmed = True
        db.commit()
        db.refresh(existing)
        return existing

    enrollment = StudentCourseEnrollment(
        student_id=profile.id,
        course_id=enroll_in.course_id,
        course_code=enroll_in.course_code,
        course_title=enroll_in.course_title,
        semester=enroll_in.semester,
        enrollment_type=enroll_in.enrollment_type,
        is_confirmed=enroll_in.is_confirmed,
        confidence_level=enroll_in.confidence_level,
        difficult_topics=enroll_in.difficult_topics or [],
        academic_goal=enroll_in.academic_goal
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment

@router.post("/my-enrollments/batch", response_model=List[StudentCourseEnrollmentOut])
def batch_save_enrollments(
    enrollments_in: List[StudentCourseEnrollmentCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Batch confirm or update enrolled courses during student onboarding or semester change.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    results = []
    for item in enrollments_in:
        existing = db.query(StudentCourseEnrollment).filter(
            StudentCourseEnrollment.student_id == profile.id,
            StudentCourseEnrollment.course_code == item.course_code,
            StudentCourseEnrollment.semester == item.semester
        ).first()
        if existing:
            existing.confidence_level = item.confidence_level
            existing.difficult_topics = item.difficult_topics or []
            existing.academic_goal = item.academic_goal
            existing.is_confirmed = True
            results.append(existing)
        else:
            enrollment = StudentCourseEnrollment(
                student_id=profile.id,
                course_id=item.course_id,
                course_code=item.course_code,
                course_title=item.course_title,
                semester=item.semester,
                enrollment_type=item.enrollment_type,
                is_confirmed=item.is_confirmed,
                confidence_level=item.confidence_level,
                difficult_topics=item.difficult_topics or [],
                academic_goal=item.academic_goal
            )
            db.add(enrollment)
            results.append(enrollment)
    db.commit()
    for r in results:
        db.refresh(r)
    return results

@router.put("/my-enrollments/{enrollment_id}", response_model=StudentCourseEnrollmentOut)
def update_my_course_enrollment(
    enrollment_id: int,
    update_in: StudentCourseEnrollmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update self-reported confidence level, difficult topics, or academic goals for an enrolled course.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    enrollment = db.query(StudentCourseEnrollment).filter(
        StudentCourseEnrollment.id == enrollment_id,
        StudentCourseEnrollment.student_id == profile.id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course enrollment record not found or access denied."
        )

    if update_in.confidence_level is not None:
        enrollment.confidence_level = update_in.confidence_level
    if update_in.difficult_topics is not None:
        enrollment.difficult_topics = update_in.difficult_topics
    if update_in.academic_goal is not None:
        enrollment.academic_goal = update_in.academic_goal
    if update_in.is_confirmed is not None:
        enrollment.is_confirmed = update_in.is_confirmed

    db.commit()
    db.refresh(enrollment)
    return enrollment

@router.delete("/my-enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_course_enrollment(
    enrollment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove an optional elective or misallocated enrollment from the student's active semester.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    enrollment = db.query(StudentCourseEnrollment).filter(
        StudentCourseEnrollment.id == enrollment_id,
        StudentCourseEnrollment.student_id == profile.id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found.")

    db.delete(enrollment)
    db.commit()
    return None

@router.post("/admin/import", response_model=CourseImportResponse)
def admin_import_courses(
    import_data: CourseImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Administrator interface for importing and updating verified MITAOE courses via JSON.
    Validates program mapping, semester boundaries, and prevents duplication.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can manage the official institution course catalog."
        )

    imported = 0
    updated = 0
    errors = []

    for item in import_data.courses:
        try:
            # Find or auto-create program
            prog = db.query(InstitutionProgram).filter(
                InstitutionProgram.institution == "MITAOE",
                InstitutionProgram.program_name == item.program_name
            ).first()
            if not prog:
                prog = InstitutionProgram(
                    institution="MITAOE",
                    program_name=item.program_name,
                    department="School of Engineering",
                    degree_type="B.Tech",
                    duration_years=4,
                    is_active=True
                )
                db.add(prog)
                db.flush()

            # Check if course exists for program & semester
            existing_course = db.query(OfficialCourse).filter(
                OfficialCourse.program_id == prog.id,
                OfficialCourse.course_code == item.course_code,
                OfficialCourse.semester == item.semester
            ).first()

            if existing_course:
                existing_course.course_title = item.course_title
                existing_course.credits = item.credits
                existing_course.course_type = item.course_type
                existing_course.curriculum_version = item.curriculum_version or "Autonomous 2022"
                if item.syllabus_topics:
                    existing_course.syllabus_topics = item.syllabus_topics
                if item.source_url:
                    existing_course.source_url = item.source_url
                updated += 1
            else:
                new_course = OfficialCourse(
                    program_id=prog.id,
                    institution="MITAOE",
                    curriculum_version=item.curriculum_version or "Autonomous 2022",
                    semester=item.semester,
                    course_code=item.course_code,
                    course_title=item.course_title,
                    credits=item.credits,
                    course_type=item.course_type,
                    syllabus_topics=item.syllabus_topics or [],
                    source_url=item.source_url,
                    verification_status="verified"
                )
                db.add(new_course)
                imported += 1
        except Exception as e:
            errors.append(f"Failed processing course '{item.course_code}': {str(e)}")

    db.commit()

    log_audit_event(
        db=db,
        action="ADMIN_CURRICULUM_IMPORTED",
        resource_type="official_courses",
        resource_id=f"imported_{imported}_updated_{updated}",
        user_id=current_user.id,
        details={"imported": imported, "updated": updated, "errors": errors}
    )

    return CourseImportResponse(
        imported_count=imported,
        updated_count=updated,
        total_processed=len(import_data.courses),
        errors=errors
    )
