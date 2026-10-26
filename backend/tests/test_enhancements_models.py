import pytest
from datetime import datetime, timezone, timedelta
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.academic_marks import SubjectAssessment
from backend.app.models.timetable import StudentTimetableConfig, StudentDeadline
from backend.app.models.reminders import NotificationPreference, StudentReminder
from backend.app.models.learning_resources import LearningResource
from backend.app.models.feedback import SupportFeedback
from backend.app.models.advisor import AdvisorIntervention
from backend.app.services.timetable_service import timetable_service

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_subject_assessment_model(db_session):
    student = db_session.query(StudentProfile).first()
    assert student is not None, "A student profile should exist"

    assessment = SubjectAssessment(
        student_id=student.id,
        subject_code="TEST101",
        subject_name="Testing Methodology",
        assessment_type="Midterm",
        obtained_score=88.5,
        max_score=100.0,
        weight_percentage=30.0,
        topic_breakdown=[{"topic": "Unit Testing", "score": 90, "max": 100}],
        assessed_date=datetime.now(timezone.utc)
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)

    assert assessment.id is not None
    assert assessment.obtained_score == 88.5
    assert assessment.student.id == student.id

    # Clean up
    db_session.delete(assessment)
    db_session.commit()

def test_timetable_and_deadlines_models(db_session):
    student = db_session.query(StudentProfile).first()
    assert student is not None

    deadline = StudentDeadline(
        student_id=student.id,
        title="Final Project Report",
        subject_code="TEST101",
        deadline_type="project",
        due_date=datetime.now(timezone.utc) + timedelta(days=5),
        estimated_hours_needed=6.0
    )
    db_session.add(deadline)
    db_session.commit()
    db_session.refresh(deadline)

    assert deadline.id is not None
    assert deadline.is_completed is False

    # Clean up
    db_session.delete(deadline)
    db_session.commit()

def test_adaptive_timetable_service_generation():
    class_sched = [
        {"day": "Monday", "start": "09:00", "end": "11:00", "subject": "CS201", "code": "CS201"}
    ]
    blocked = [
        {"day": "Saturday", "start": "10:00", "end": "14:00", "label": "Work"}
    ]
    schedule = timetable_service.generate_adaptive_schedule(
        class_schedule=class_sched,
        blocked_slots=blocked,
        daily_study_goal_hours=2.5,
        preferred_window="Evening",
        weak_subjects=["CS201"]
    )
    assert "Monday" in schedule
    assert "Saturday" in schedule
    assert any(item["type"] == "class" for item in schedule["Monday"])
    assert any(item["type"] == "commitment" for item in schedule["Saturday"])
    assert any(item["type"] == "study" for item in schedule["Monday"])

def test_learning_resource_model(db_session):
    resource = LearningResource(
        title="Pytest Mastery Guide",
        description="Best practices for test driven development",
        department="CS",
        subject_code="CS300",
        category="Interactive Practice",
        difficulty="Intermediate",
        url="https://pytest.org",
        provider="Pytest Community",
        is_verified=True,
        rating=5.0
    )
    db_session.add(resource)
    db_session.commit()
    db_session.refresh(resource)

    assert resource.id is not None
    assert resource.is_verified is True

    # Clean up
    db_session.delete(resource)
    db_session.commit()

def test_support_feedback_model(db_session):
    user = db_session.query(User).filter(User.role == "student").first()
    assert user is not None

    feedback = SupportFeedback(
        user_id=user.id,
        feedback_type="learning_resource",
        target_id=1,
        target_title="Algorithms Guide",
        rating=5,
        effectiveness="Highly Effective",
        comments="Great breakdown of trees."
    )
    db_session.add(feedback)
    db_session.commit()
    db_session.refresh(feedback)

    assert feedback.id is not None
    assert feedback.rating == 5

    # Clean up
    db_session.delete(feedback)
    db_session.commit()

def test_advisor_intervention_enrichment(db_session):
    advisor = db_session.query(User).filter(User.role == "advisor").first()
    student = db_session.query(StudentProfile).first()
    assert advisor is not None
    assert student is not None

    intervention = AdvisorIntervention(
        advisor_id=advisor.id,
        student_id=student.id,
        intervention_type="Academic Tutoring Check-in",
        status="requested_by_student",
        urgency="High",
        modality="Video Consultation",
        meeting_link_or_location="https://zoom.us/j/12345678",
        follow_up_notes="Student will complete 3 practice problems per week."
    )
    db_session.add(intervention)
    db_session.commit()
    db_session.refresh(intervention)

    assert intervention.urgency == "High"
    assert intervention.modality == "Video Consultation"
    assert intervention.meeting_link_or_location == "https://zoom.us/j/12345678"

    # Clean up
    db_session.delete(intervention)
    db_session.commit()
