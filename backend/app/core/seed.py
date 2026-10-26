from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.academic_marks import SubjectAssessment
from backend.app.models.timetable import StudentTimetableConfig, StudentDeadline
from backend.app.models.reminders import NotificationPreference, StudentReminder
from backend.app.models.learning_resources import LearningResource

def seed_enhanced_records(db: Session):
    """
    Seeds real subject assessments, verified learning resources, deadlines,
    and notification preferences for demonstration and empirical verification.
    """
    # 1. Seed Verified Educational Resources
    if db.query(LearningResource).count() == 0:
        resources = [
            LearningResource(
                title="MIT OpenCourseWare: Introduction to Algorithms (6.006)",
                description="Comprehensive lecture series and problem sets covering Big-O analysis, sorting algorithms, balanced BSTs, dynamic programming, and shortest path graphs.",
                department="CS",
                subject_code="CS201",
                concept_tag="Data Structures & Algorithms",
                category="Video Lecture",
                difficulty="Intermediate",
                url="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
                provider="MIT OpenCourseWare",
                estimated_minutes=60,
                rating=4.9,
                rating_count=340
            ),
            LearningResource(
                title="Khan Academy: Linear Algebra & Differential Calculus",
                description="Interactive step-by-step visualizations and practice questions for matrices, dot products, eigenvalues, and derivative mechanics.",
                department="Science",
                subject_code="MATH101",
                concept_tag="Calculus & Linear Algebra",
                category="Interactive Practice",
                difficulty="Beginner",
                url="https://www.khanacademy.org/math/linear-algebra",
                provider="Khan Academy",
                estimated_minutes=40,
                rating=4.8,
                rating_count=512
            ),
            LearningResource(
                title="Stanford Engineering Everywhere: Programming Methodologies",
                description="Foundational computer science principles, recursion, memory management, pointers, and object-oriented paradigms.",
                department="CS",
                subject_code="CS106",
                concept_tag="Programming Fundamentals",
                category="Video Lecture",
                difficulty="Beginner",
                url="https://see.stanford.edu/Course/CS106A",
                provider="Stanford University",
                estimated_minutes=50,
                rating=4.9,
                rating_count=215
            ),
            LearningResource(
                title="NPTEL: Discrete Mathematics Core Concepts",
                description="Curated video modules covering propositional logic, set theory, combinatorics, recurrence relations, and graph colorings.",
                department="CS",
                subject_code="MATH205",
                concept_tag="Discrete Mathematics",
                category="Video Lecture",
                difficulty="Intermediate",
                url="https://nptel.ac.in/courses/106106094",
                provider="NPTEL",
                estimated_minutes=45,
                rating=4.7,
                rating_count=180
            ),
            LearningResource(
                title="University Academic Success Center: Master Schedule & Pomodoro Guide",
                description="Evidence-backed strategies for time chunking, managing study-work boundaries, avoiding procrastination, and exam preparation checklists.",
                department="General",
                subject_code="GEN101",
                concept_tag="Time Management & Study Habits",
                category="Academic Guide",
                difficulty="Beginner",
                url="https://learningcenter.unc.edu/tips-and-tools/studying-101/",
                provider="University Learning Center",
                estimated_minutes=25,
                rating=4.8,
                rating_count=98
            ),
            LearningResource(
                title="Harvard Division of Continuing Education: Academic Writing & Citation",
                description="Guide on framing research essays, synthesizing academic sources, preventing accidental plagiarism, and structuring literature reviews.",
                department="Arts",
                subject_code="ENG101",
                concept_tag="Academic Writing & Research",
                category="Academic Guide",
                difficulty="Intermediate",
                url="https://writingcenter.fas.harvard.edu/pages/strategies-essay-writing",
                provider="Harvard Writing Center",
                estimated_minutes=35,
                rating=4.9,
                rating_count=142
            ),
            LearningResource(
                title="Coursera Open: Financial Accounting Fundamentals",
                description="Balance sheets, cash flow statements, accrual accounting, and ledger reconciliations with real business cases.",
                department="Business",
                subject_code="BUS201",
                concept_tag="Financial Accounting",
                category="Interactive Practice",
                difficulty="Beginner",
                url="https://www.coursera.org/learn/wharton-accounting",
                provider="Wharton / Coursera",
                estimated_minutes=55,
                rating=4.7,
                rating_count=290
            ),
            LearningResource(
                title="Circuits & Electronics: edX MITx 6.002x",
                description="RLC circuit frequency analysis, operational amplifiers, lumped circuit abstraction, and digital logic interfaces.",
                department="Engineering",
                subject_code="ENG202",
                concept_tag="Circuits & Electronics",
                category="Video Lecture",
                difficulty="Advanced",
                url="https://www.edx.org/learn/circuits/massachusetts-institute-of-technology-circuits-and-electronics-1-basic-circuit-analysis",
                provider="MITx / edX",
                estimated_minutes=60,
                rating=4.8,
                rating_count=175
            )
        ]
        db.add_all(resources)
        db.commit()
        print("[Seed] Inserted verified learning resources.")

    # 2. Seed Student Subject Assessments (Alex Rivera)
    student_user = db.query(User).filter(User.email == "student@university.edu").first()
    if student_user and student_user.student_profile:
        profile = student_user.student_profile
        
        # Seed assessments if none exist
        if db.query(SubjectAssessment).filter(SubjectAssessment.student_id == profile.id).count() == 0:
            now = datetime.now(timezone.utc)
            assessments = [
                SubjectAssessment(
                    student_id=profile.id,
                    subject_code="CS201",
                    subject_name="Data Structures & Algorithms",
                    assessment_type="Midterm Exam",
                    obtained_score=52.0,
                    max_score=100.0,
                    weight_percentage=25.0,
                    topic_breakdown=[
                        {"topic": "Arrays & Strings", "score": 78.0, "max": 100.0},
                        {"topic": "Linked Lists & Stacks", "score": 62.0, "max": 100.0},
                        {"topic": "Trees & Binary Heaps", "score": 42.0, "max": 100.0},
                        {"topic": "Dynamic Programming", "score": 45.0, "max": 100.0}
                    ],
                    assessed_date=now - timedelta(days=14)
                ),
                SubjectAssessment(
                    student_id=profile.id,
                    subject_code="CS201",
                    subject_name="Data Structures & Algorithms",
                    assessment_type="Quiz 1",
                    obtained_score=48.0,
                    max_score=100.0,
                    weight_percentage=10.0,
                    topic_breakdown=[
                        {"topic": "Big-O Asymptotic Analysis", "score": 50.0, "max": 100.0},
                        {"topic": "Recursion Depth", "score": 46.0, "max": 100.0}
                    ],
                    assessed_date=now - timedelta(days=28)
                ),
                SubjectAssessment(
                    student_id=profile.id,
                    subject_code="MATH205",
                    subject_name="Discrete Mathematics",
                    assessment_type="Midterm Exam",
                    obtained_score=64.0,
                    max_score=100.0,
                    weight_percentage=25.0,
                    topic_breakdown=[
                        {"topic": "Propositional Logic", "score": 82.0, "max": 100.0},
                        {"topic": "Set Theory & Relations", "score": 74.0, "max": 100.0},
                        {"topic": "Graph Theory & Trees", "score": 52.0, "max": 100.0},
                        {"topic": "Combinatorics", "score": 48.0, "max": 100.0}
                    ],
                    assessed_date=now - timedelta(days=12)
                ),
                SubjectAssessment(
                    student_id=profile.id,
                    subject_code="CS203",
                    subject_name="Computer Organization & Architecture",
                    assessment_type="Midterm Exam",
                    obtained_score=74.0,
                    max_score=100.0,
                    weight_percentage=25.0,
                    topic_breakdown=[
                        {"topic": "Instruction Set Architecture", "score": 80.0, "max": 100.0},
                        {"topic": "Memory Hierarchy & Caching", "score": 68.0, "max": 100.0}
                    ],
                    assessed_date=now - timedelta(days=10)
                ),
                SubjectAssessment(
                    student_id=profile.id,
                    subject_code="CS203",
                    subject_name="Computer Organization & Architecture",
                    assessment_type="Lab Practical 1",
                    obtained_score=78.0,
                    max_score=100.0,
                    weight_percentage=15.0,
                    topic_breakdown=[
                        {"topic": "Assembly Simulation", "score": 78.0, "max": 100.0}
                    ],
                    assessed_date=now - timedelta(days=20)
                ),
                SubjectAssessment(
                    student_id=profile.id,
                    subject_code="HUM102",
                    subject_name="Professional Ethics & Communication",
                    assessment_type="Assignment 1",
                    obtained_score=85.0,
                    max_score=100.0,
                    weight_percentage=20.0,
                    topic_breakdown=[
                        {"topic": "Case Analysis", "score": 85.0, "max": 100.0}
                    ],
                    assessed_date=now - timedelta(days=7)
                )
            ]
            db.add_all(assessments)
            db.commit()
            print("[Seed] Inserted subject assessments for default student.")

        # 3. Seed Deadlines
        if db.query(StudentDeadline).filter(StudentDeadline.student_id == profile.id).count() == 0:
            now = datetime.now(timezone.utc)
            deadlines = [
                StudentDeadline(
                    student_id=profile.id,
                    title="CS201 Programming Assignment 3: AVL Tree Balancing",
                    subject_code="CS201",
                    deadline_type="assignment",
                    due_date=now + timedelta(days=3, hours=4),
                    estimated_hours_needed=5.0,
                    is_completed=False
                ),
                StudentDeadline(
                    student_id=profile.id,
                    title="MATH205 Problem Set 4: Graph Proofs",
                    subject_code="MATH205",
                    deadline_type="assignment",
                    due_date=now + timedelta(days=6, hours=2),
                    estimated_hours_needed=3.5,
                    is_completed=False
                ),
                StudentDeadline(
                    student_id=profile.id,
                    title="CS203 Lab 2: Cache Simulation Benchmark",
                    subject_code="CS203",
                    deadline_type="project",
                    due_date=now + timedelta(days=9),
                    estimated_hours_needed=4.0,
                    is_completed=False
                )
            ]
            db.add_all(deadlines)
            db.commit()
            print("[Seed] Inserted deadlines for default student.")

        # 4. Seed Notification Preferences
        if not student_user.notification_preferences:
            pref = NotificationPreference(
                user_id=student_user.id,
                assignment_reminders=True,
                assignment_lead_hours=24,
                daily_study_reminders=True,
                study_reminder_time="18:30",
                advisor_meeting_reminders=True,
                advisor_lead_hours=2,
                risk_alert_notifications=True,
                email_notifications=False
            )
            db.add(pref)
            db.commit()
            print("[Seed] Created default notification preferences for student.")

        # 5. Seed Student Timetable Configuration with Fixed Class Hours and Availability
        if not profile.timetable_config:
            class_sched = [
                {"day": "Monday", "start": "09:00", "end": "11:00", "subject": "CS201 Data Structures", "code": "CS201", "room": "Hall 102"},
                {"day": "Monday", "start": "13:30", "end": "15:30", "subject": "CS203 Architecture Lab", "code": "CS203", "room": "Lab 3"},
                {"day": "Tuesday", "start": "10:00", "end": "12:00", "subject": "MATH205 Discrete Math", "code": "MATH205", "room": "Room 204"},
                {"day": "Wednesday", "start": "09:00", "end": "11:00", "subject": "CS201 Data Structures", "code": "CS201", "room": "Hall 102"},
                {"day": "Wednesday", "start": "14:00", "end": "16:00", "subject": "CS201 Algorithm Lab", "code": "CS201", "room": "Lab 1"},
                {"day": "Thursday", "start": "10:00", "end": "12:00", "subject": "MATH205 Discrete Math", "code": "MATH205", "room": "Room 204"},
                {"day": "Thursday", "start": "14:00", "end": "15:30", "subject": "HUM102 Ethics Seminar", "code": "HUM102", "room": "Room 108"},
                {"day": "Friday", "start": "09:00", "end": "11:00", "subject": "CS203 Architecture", "code": "CS203", "room": "Hall 102"}
            ]
            blocked = [
                {"day": "Saturday", "start": "10:00", "end": "16:00", "label": "Part-Time Campus Job"},
                {"day": "Sunday", "start": "13:00", "end": "17:00", "label": "Part-Time Campus Job"}
            ]
            
            from backend.app.services.timetable_service import timetable_service
            adaptive_tt = timetable_service.generate_adaptive_schedule(
                class_schedule=class_sched,
                blocked_slots=blocked,
                daily_study_goal_hours=profile.study_hours_per_day or 3.0,
                preferred_window="Evening",
                weak_subjects=["CS201", "MATH205"]
            )
            
            cfg = StudentTimetableConfig(
                student_id=profile.id,
                daily_study_goal_hours=profile.study_hours_per_day or 3.0,
                preferred_study_window="Evening",
                blocked_slots=blocked,
                class_schedule=class_sched,
                generated_timetable=adaptive_tt
            )
            db.add(cfg)
            db.commit()
            print("[Seed] Created adaptive student timetable configuration.")
