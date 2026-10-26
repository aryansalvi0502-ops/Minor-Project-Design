"""
Seeds official MITAOE programs and verified courses into the database.
Also seeds demo student's verified course enrollments.
"""

from sqlalchemy.orm import Session
from backend.app.models.curriculum import InstitutionProgram, OfficialCourse, StudentCourseEnrollment
from backend.app.models.profile import StudentProfile
from backend.app.core.mitaoe_curriculum_data import MITAOE_PROGRAMS, OFFICIAL_MITAOE_COURSES

def seed_mitaoe_curriculum(db: Session):
    # 1. Seed or update programs
    program_map = {}
    for p_data in MITAOE_PROGRAMS:
        prog = db.query(InstitutionProgram).filter(
            InstitutionProgram.institution == "MITAOE",
            InstitutionProgram.program_name == p_data["program_name"]
        ).first()
        if not prog:
            prog = InstitutionProgram(
                institution="MITAOE",
                program_name=p_data["program_name"],
                department=p_data["department"],
                degree_type=p_data["degree_type"],
                duration_years=p_data["duration_years"],
                is_active=p_data["is_active"]
            )
            db.add(prog)
            db.flush()
        program_map[p_data["program_name"]] = prog

    # 2. Seed or update official courses
    for c_data in OFFICIAL_MITAOE_COURSES:
        prog = program_map.get(c_data["program_name"])
        if not prog:
            continue
        course = db.query(OfficialCourse).filter(
            OfficialCourse.program_id == prog.id,
            OfficialCourse.course_code == c_data["course_code"],
            OfficialCourse.semester == c_data["semester"]
        ).first()
        if not course:
            course = OfficialCourse(
                program_id=prog.id,
                institution="MITAOE",
                curriculum_version="Autonomous 2022",
                semester=c_data["semester"],
                course_code=c_data["course_code"],
                course_title=c_data["course_title"],
                credits=c_data["credits"],
                course_type=c_data["course_type"],
                syllabus_topics=c_data.get("syllabus_topics", []),
                source_url=c_data.get("source_url"),
                verification_status=c_data.get("verification_status", "verified")
            )
            db.add(course)
        else:
            # Update fields if needed
            course.syllabus_topics = c_data.get("syllabus_topics", [])
            course.source_url = c_data.get("source_url")
            course.verification_status = c_data.get("verification_status", "verified")
    db.commit()

    # 3. Seed demo student's MITAOE enrollments if not already present
    demo_profile = db.query(StudentProfile).filter(
        StudentProfile.student_institutional_id == "STU-2024-001"
    ).first()

    if demo_profile:
        # Update institutional attributes
        demo_profile.institution = "MITAOE"
        demo_profile.degree_program = "Computer Engineering"
        demo_profile.admission_batch = "2023-2027"
        demo_profile.curriculum_version = "Autonomous 2022"

        # Check existing enrollments
        existing_count = db.query(StudentCourseEnrollment).filter(
            StudentCourseEnrollment.student_id == demo_profile.id
        ).count()

        if existing_count == 0:
            # Enroll student in Semester 3 Computer Engineering courses
            ce_prog = program_map.get("Computer Engineering")
            if ce_prog:
                sem3_courses = db.query(OfficialCourse).filter(
                    OfficialCourse.program_id == ce_prog.id,
                    OfficialCourse.semester == 3
                ).all()

                for crs in sem3_courses:
                    # Provide realistic academic confidence and goals
                    conf = "Medium"
                    diff_topics = []
                    goal = "Grade A (80%+)"
                    if crs.course_code == "CS201":
                        conf = "Low"
                        diff_topics = ["Dynamic Programming", "Graph Traversals (BFS, DFS)"]
                        goal = "Target Grade B+ (75%+)"
                    elif crs.course_code == "CS202":
                        conf = "Medium"
                        diff_topics = ["Graph Theory & Recurrence Relations"]
                    elif crs.course_code == "ET206":
                        conf = "High"
                        goal = "Target Grade A+ (90%+)"

                    enrollment = StudentCourseEnrollment(
                        student_id=demo_profile.id,
                        course_id=crs.id,
                        course_code=crs.course_code,
                        course_title=crs.course_title,
                        semester=crs.semester,
                        enrollment_type=crs.course_type,
                        is_confirmed=True,
                        confidence_level=conf,
                        difficult_topics=diff_topics,
                        academic_goal=goal
                    )
                    db.add(enrollment)
                db.commit()
