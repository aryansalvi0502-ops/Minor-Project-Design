import pytest
from datetime import datetime, timezone
from backend.app.models.profile import StudentProfile
from backend.app.services.recovery_service import recovery_service

def test_recovery_plan_generation_high_risk():
    dummy_profile = StudentProfile(
        id=999,
        user_id=999,
        student_institutional_id="TEST-999",
        department="CS",
        semester="Year 2",
        age=20.0,
        gender="Female",
        attendance_rate=62.0,  # Below 75% -> triggers attendance action
        assignment_delay_days=4, # >= 2 -> triggers assignment breakdown
        study_hours_per_day=1.5, # < 3.0 -> triggers study habit goals
        stress_index=8.5,        # >= 7.0 -> triggers wellness referral
        gpa=1.5,                 # < 2.0 -> triggers tutoring
        semester_gpa=1.3,
        cgpa=1.4
    )

    plan_data = recovery_service.generate_plan_data(
        profile=dummy_profile,
        risk_category="High",
        risk_score=82.5
    )

    assert plan_data["risk_level"] == "High"
    assert len(plan_data["identified_areas"]) >= 4
    assert any("Attendance" in area for area in plan_data["identified_areas"])
    assert any("Academic" in area for area in plan_data["identified_areas"])
    assert len(plan_data["tasks"]) >= 4
    assert "suggested_timetable" in plan_data
    assert "Monday" in plan_data["suggested_timetable"]
    assert "Saturday" in plan_data["suggested_timetable"]

def test_recovery_plan_generation_low_risk():
    dummy_profile = StudentProfile(
        id=998,
        user_id=998,
        student_institutional_id="TEST-998",
        department="Engineering",
        semester="Year 3",
        age=21.0,
        gender="Male",
        attendance_rate=95.0,
        assignment_delay_days=0,
        study_hours_per_day=5.0,
        stress_index=3.0,
        gpa=3.8,
        semester_gpa=3.85,
        cgpa=3.82
    )

    plan_data = recovery_service.generate_plan_data(
        profile=dummy_profile,
        risk_category="Low",
        risk_score=12.0
    )

    assert plan_data["risk_level"] == "Low"
    assert "Good Academic Standing" in plan_data["identified_areas"][0]
    assert len(plan_data["tasks"]) >= 1
