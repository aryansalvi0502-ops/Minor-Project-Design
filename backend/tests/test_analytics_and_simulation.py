import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.core.security import create_access_token
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.academic_marks import SubjectAssessment
from backend.app.services.learning_gap_service import learning_gap_service

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def student_auth_headers():
    db = SessionLocal()
    student = db.query(User).filter(User.email == "student@university.edu").first()
    db.close()
    assert student is not None
    token = create_access_token(student.id, role=student.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def advisor_auth_headers():
    db = SessionLocal()
    adv = db.query(User).filter(User.email == "advisor@university.edu").first()
    db.close()
    assert adv is not None
    token = create_access_token(adv.id, role=adv.role)
    return {"Authorization": f"Bearer {token}"}

def test_learning_gap_service_unit():
    assessments = [
        SubjectAssessment(
            student_id=1,
            subject_code="CS201",
            subject_name="Data Structures",
            assessment_type="Midterm",
            obtained_score=45.0,
            max_score=100.0,
            weight_percentage=30.0,
            topic_breakdown=[
                {"topic": "Trees & Heaps", "score": 38.0, "max": 100.0},
                {"topic": "Arrays", "score": 75.0, "max": 100.0}
            ],
            assessed_date=datetime.now(timezone.utc)
        ),
        SubjectAssessment(
            student_id=1,
            subject_code="CS201",
            subject_name="Data Structures",
            assessment_type="Quiz 1",
            obtained_score=50.0,
            max_score=100.0,
            weight_percentage=10.0,
            topic_breakdown=[
                {"topic": "Trees & Heaps", "score": 42.0, "max": 100.0}
            ],
            assessed_date=datetime.now(timezone.utc)
        )
    ]
    report = learning_gap_service.analyze_student_gaps(assessments)
    assert report.total_assessments_recorded == 2
    assert report.overall_academic_average < 60.0
    assert len(report.critical_concept_gaps) >= 1
    top_gap = report.critical_concept_gaps[0]
    assert top_gap.topic == "Trees & Heaps"
    assert top_gap.severity == "Critical Gap"
    assert len(report.actionable_remediations) > 0

def test_get_my_learning_gaps_api(client, student_auth_headers):
    response = client.get("/api/v1/profiles/me/learning-gaps", headers=student_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "overall_academic_average" in data
    assert "subjects_summary" in data
    assert "critical_concept_gaps" in data
    assert len(data["subjects_summary"]) >= 1

def test_get_my_subject_marks_api(client, student_auth_headers):
    response = client.get("/api/v1/profiles/me/subject-marks", headers=student_auth_headers)
    assert response.status_code == 200
    marks = response.json()
    assert isinstance(marks, list)
    assert len(marks) >= 1
    assert "subject_code" in marks[0]
    assert "obtained_score" in marks[0]

def test_advisor_get_student_learning_gaps(client, advisor_auth_headers):
    db = SessionLocal()
    student_profile = db.query(StudentProfile).first()
    db.close()
    assert student_profile is not None

    response = client.get(
        f"/api/v1/advisor/students/{student_profile.id}/learning-gaps",
        headers=advisor_auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "subjects_summary" in data

def test_prediction_trends_endpoint(client, student_auth_headers):
    response = client.get("/api/v1/predictions/trends", headers=student_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "current_risk_score" in data
    assert "direction" in data
    assert "trend_narrative" in data
    assert "history_timeline" in data

def test_what_if_simulator_endpoint(client, student_auth_headers):
    payload = {
        "gpa": 9.2,
        "study_hours_per_day": 5.0,
        "attendance_rate": 96.0,
        "assignment_delay_days": 0,
        "stress_index": 3.0
    }
    response = client.post("/api/v1/predictions/simulate-what-if", json=payload, headers=student_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "simulated_risk_score" in data
    assert "risk_score" in data
    assert "dropout_probability" in data
    assert isinstance(data["risk_score"], (int, float))
    assert not (data["risk_score"] != data["risk_score"]) # not NaN
    assert "score_delta" in data
    assert "ethical_disclaimer" in data
    assert "Hypothetical projection only" in data["ethical_disclaimer"]
    assert data["simulated_risk_category"] in ["Low", "Medium", "High"]
    assert "academic_standing_tier" in data

def test_what_if_simulator_boundary_and_partial_values(client, student_auth_headers):
    # Boundary test: low boundary
    res_low = client.post("/api/v1/predictions/simulate-what-if", json={"gpa": 0.0, "attendance_rate": 0.0}, headers=student_auth_headers)
    assert res_low.status_code == 200
    low_data = res_low.json()
    assert low_data["risk_score"] >= 0.0 and low_data["risk_score"] <= 100.0
    assert "Critical" in low_data["academic_standing_tier"]

    # Boundary test: high distinction boundary
    res_high = client.post("/api/v1/predictions/simulate-what-if", json={"gpa": 10.0, "attendance_rate": 100.0}, headers=student_auth_headers)
    assert res_high.status_code == 200
    high_data = res_high.json()
    assert high_data["risk_score"] >= 0.0 and high_data["risk_score"] <= 100.0
    assert "Distinction" in high_data["academic_standing_tier"]

    # Empty payload (should cleanly use student baseline values)
    res_empty = client.post("/api/v1/predictions/simulate-what-if", json={}, headers=student_auth_headers)
    assert res_empty.status_code == 200
    empty_data = res_empty.json()
    assert empty_data["risk_score"] is not None

def test_what_if_simulator_invalid_inputs(client, student_auth_headers):
    # GPA out of range (> 10.0)
    res = client.post("/api/v1/predictions/simulate-what-if", json={"gpa": 12.5}, headers=student_auth_headers)
    assert res.status_code == 422

    # Attendance out of range (> 100)
    res2 = client.post("/api/v1/predictions/simulate-what-if", json={"attendance_rate": 150.0}, headers=student_auth_headers)
    assert res2.status_code == 422
