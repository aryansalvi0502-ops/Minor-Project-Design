import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.schemas.profile import StudentProfileOut

client = TestClient(app)

def login(email, password):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return resp

def test_valid_advisor_profile_and_cohort():
    """Case 1: A valid logged-in advisor with complete profile accessing /auth/me and assigned cohort."""
    login_resp = login("advisor@university.edu", "AdvisorPass123!")
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    user_data = login_resp.json()["user"]

    assert user_data["full_name"] == "Disha Malpure Ma'am (Advisor)"
    assert user_data["role"] == "advisor"
    assert user_data["department"] == "Computer Engineering"

    # Verify /auth/me returns valid full_name and profile data
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["full_name"] == "Disha Malpure Ma'am (Advisor)"
    assert me_data["email"] == "advisor@university.edu"

    # Verify /advisor/assigned-students returns students with full_name populated
    cohort_resp = client.get("/api/v1/advisor/assigned-students", headers={"Authorization": f"Bearer {token}"})
    assert cohort_resp.status_code == 200
    cohort = cohort_resp.json()
    assert len(cohort) >= 1
    for s in cohort:
        assert s["full_name"] is not None
        assert s["full_name"] != ""
        assert "email" in s

def test_missing_student_profile_flow():
    """Case 2: A user whose student profile is missing returns 404 or safe error instead of crashing."""
    # Advisor does not have a student profile
    login_resp = login("advisor@university.edu", "AdvisorPass123!")
    token = login_resp.json()["access_token"]

    prof_resp = client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {token}"})
    # Must be 400 because advisor is not a student
    assert prof_resp.status_code == 400
    assert "not a student profile" in prof_resp.json()["detail"].lower()

def test_null_or_expired_session():
    """Case 3: A null or expired session returns 401 Unauthorized without 500 error."""
    # No header
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401

    # Invalid / expired token
    resp_bad = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid_expired_token"})
    assert resp_bad.status_code == 401

    # Unauthorized access to advisor cohort
    resp_cohort = client.get("/api/v1/advisor/assigned-students", headers={"Authorization": "Bearer bad_token"})
    assert resp_cohort.status_code == 401

def test_student_profile_out_serialization_with_full_name():
    """Case 4 & 6: StudentProfileOut schema serializes full_name and email properties safely."""
    db = SessionLocal()
    try:
        profile = db.query(StudentProfile).first()
        assert profile is not None
        # Test model properties
        assert profile.full_name is not None
        assert profile.email is not None

        # Test Pydantic schema serialization
        out = StudentProfileOut.model_validate(profile)
        assert out.full_name == profile.user.full_name
        assert out.email == profile.user.email
    finally:
        db.close()

def test_student_and_management_access_isolation():
    """Case 7: Student and management users accessing their authorized endpoints, isolated from advisor console."""
    # Student login
    stu_login = login("student@university.edu", "StudentPass123!")
    assert stu_login.status_code == 200
    stu_token = stu_login.json()["access_token"]
    stu_user = stu_login.json()["user"]
    assert stu_user["full_name"] == "Aarav Deshmukh"

    # Student cannot access advisor assigned students
    stu_cohort = client.get("/api/v1/advisor/assigned-students", headers={"Authorization": f"Bearer {stu_token}"})
    assert stu_cohort.status_code == 403

    # Student can access own profile with full_name
    stu_prof = client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {stu_token}"})
    assert stu_prof.status_code == 200
    prof_data = stu_prof.json()
    assert prof_data["full_name"] == "Aarav Deshmukh"

    # Management login
    mgmt_login = login("management@university.edu", "ManagePass123!")
    assert mgmt_login.status_code == 200
    mgmt_token = mgmt_login.json()["access_token"]
    mgmt_user = mgmt_login.json()["user"]
    assert mgmt_user["full_name"] == "Prof. Arjun Kulkarni (Dean, Academics)"

    # Management cannot access advisor assigned-students
    mgmt_cohort = client.get("/api/v1/advisor/assigned-students", headers={"Authorization": f"Bearer {mgmt_token}"})
    assert mgmt_cohort.status_code == 403

    # Management CAN access aggregated analytics
    mgmt_overview = client.get("/api/v1/analytics/overview", headers={"Authorization": f"Bearer {mgmt_token}"})
    assert mgmt_overview.status_code == 200
