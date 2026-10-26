import pytest
from backend.app.schemas.profile import StudentProfileUpdate
from backend.app.services.recovery_service import recovery_service
from backend.app.models.profile import StudentProfile

def test_profile_schema_allows_gpa_out_of_10():
    update_data = StudentProfileUpdate(gpa=8.5, semester_gpa=8.2, cgpa=8.4)
    assert update_data.gpa == 8.5
    assert update_data.semester_gpa == 8.2
    assert update_data.cgpa == 8.4

def test_recovery_service_10_scale_gpa_thresholds():
    # Student with critical GPA (< 5.0 out of 10)
    low_student = StudentProfile(
        id=1,
        user_id=1,
        student_institutional_id="S-001",
        department="CS",
        semester="Year 2",
        age=20.0,
        gender="Male",
        attendance_rate=80.0,
        assignment_delay_days=1,
        study_hours_per_day=3.0,
        stress_index=5.0,
        gpa=4.5,
        semester_gpa=4.2,
        cgpa=4.3
    )
    plan_low = recovery_service.generate_plan_data(low_student, risk_category="High", risk_score=75.0)
    assert any("Academic Performance Concern" in area for area in plan_low["identified_areas"])

    # Student with good GPA (>= 7.0 out of 10)
    high_student = StudentProfile(
        id=2,
        user_id=2,
        student_institutional_id="S-002",
        department="CS",
        semester="Year 2",
        age=20.0,
        gender="Female",
        attendance_rate=90.0,
        assignment_delay_days=0,
        study_hours_per_day=4.0,
        stress_index=4.0,
        gpa=8.5,
        semester_gpa=8.7,
        cgpa=8.6
    )
    plan_high = recovery_service.generate_plan_data(high_student, risk_category="Low", risk_score=15.0)
    assert not any("Academic Performance Concern" in area for area in plan_high["identified_areas"])
