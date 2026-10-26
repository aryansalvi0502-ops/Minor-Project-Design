import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.core.security import get_password_hash, create_access_token
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.prediction import PredictionRecord

# Use in-memory SQLite specifically for auth isolation tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()

    # Create 2 Students, 2 Advisors, 1 Management, 1 Admin
    # Student 1
    s1 = User(email="student1@uni.edu", hashed_password=get_password_hash("pass1234"), full_name="Student One", role="student")
    # Student 2
    s2 = User(email="student2@uni.edu", hashed_password=get_password_hash("pass1234"), full_name="Student Two", role="student")
    # Advisor 1 (assigned to student 1)
    a1 = User(email="advisor1@uni.edu", hashed_password=get_password_hash("pass1234"), full_name="Advisor Alpha", role="advisor", department="CS")
    # Advisor 2 (not assigned to student 1)
    a2 = User(email="advisor2@uni.edu", hashed_password=get_password_hash("pass1234"), full_name="Advisor Beta", role="advisor", department="Arts")
    # Management
    m1 = User(email="mgmt@uni.edu", hashed_password=get_password_hash("pass1234"), full_name="Dean Reviewer", role="management")
    # Admin
    adm = User(email="admin@uni.edu", hashed_password=get_password_hash("pass1234"), full_name="System Admin", role="admin")

    db.add_all([s1, s2, a1, a2, m1, adm])
    db.commit()

    # Create profiles
    p1 = StudentProfile(
        user_id=s1.id,
        student_institutional_id="STU-001",
        department="CS",
        semester="Year 2",
        age=20.0,
        gender="Male",
        attendance_rate=80.0,
        gpa=2.8,
        semester_gpa=2.7,
        cgpa=2.75,
        assigned_advisor_id=a1.id
    )
    p2 = StudentProfile(
        user_id=s2.id,
        student_institutional_id="STU-002",
        department="Arts",
        semester="Year 3",
        age=21.0,
        gender="Female",
        attendance_rate=65.0,
        gpa=1.9,
        semester_gpa=1.8,
        cgpa=1.85,
        assigned_advisor_id=a2.id
    )
    db.add_all([p1, p2])
    db.commit()

    yield
    Base.metadata.drop_all(bind=engine_test)
    app.dependency_overrides.clear()

client = TestClient(app)

def test_password_hashing():
    from backend.app.core.security import verify_password
    plain = "TestPass99!"
    hashed = get_password_hash(plain)
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPass", hashed) is False

def test_student_cannot_access_another_student_profile():
    """Security Test: Student 1 attempts to access Student 2's profile by ID"""
    token_s1 = create_access_token(subject=1, role="student")
    
    # Attempt to view Profile 2 (owned by Student 2)
    response = client.get(
        "/api/v1/profiles/2",
        headers={"Authorization": f"Bearer {token_s1}"}
    )
    assert response.status_code == 403
    assert "Students can only access their own profile" in response.json()["detail"]

def test_student_can_access_own_profile():
    token_s1 = create_access_token(subject=1, role="student")
    response = client.get(
        "/api/v1/profiles/1",
        headers={"Authorization": f"Bearer {token_s1}"}
    )
    assert response.status_code == 200
    assert response.json()["student_institutional_id"] == "STU-001"

def test_advisor_can_only_access_assigned_student():
    """Advisor 1 is assigned to Student 1, NOT Student 2"""
    token_a1 = create_access_token(subject=3, role="advisor")
    
    # Advisor 1 accesses Student 1 -> Permitted (200)
    res_allowed = client.get(
        "/api/v1/profiles/1",
        headers={"Authorization": f"Bearer {token_a1}"}
    )
    assert res_allowed.status_code == 200

    # Advisor 1 accesses Student 2 -> Denied (403)
    res_denied = client.get(
        "/api/v1/profiles/2",
        headers={"Authorization": f"Bearer {token_a1}"}
    )
    assert res_denied.status_code == 403
    assert "authorized to review students assigned" in res_denied.json()["detail"]

def test_management_cannot_view_individual_student():
    """Management role has aggregate de-identified access and cannot inspect individual student records"""
    token_mgmt = create_access_token(subject=5, role="management")
    response = client.get(
        "/api/v1/profiles/1",
        headers={"Authorization": f"Bearer {token_mgmt}"}
    )
    assert response.status_code == 403
    assert "Management role has aggregate de-identified access" in response.json()["detail"]

def test_management_can_access_aggregate_analytics():
    token_mgmt = create_access_token(subject=5, role="management")
    response = client.get(
        "/api/v1/analytics/overview",
        headers={"Authorization": f"Bearer {token_mgmt}"}
    )
    assert response.status_code == 200
    assert "overall_risk_distribution" in response.json()
    assert "department_breakdown" in response.json()

def test_admin_can_access_all_and_admin_endpoints():
    token_admin = create_access_token(subject=6, role="admin")
    
    # Can access any profile
    res_prof = client.get("/api/v1/profiles/1", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_prof.status_code == 200
    
    # Can access system health
    res_health = client.get("/api/v1/admin/system-health", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_health.status_code == 200

def test_student_cannot_access_admin_endpoints():
    token_s1 = create_access_token(subject=1, role="student")
    response = client.get(
        "/api/v1/admin/system-health",
        headers={"Authorization": f"Bearer {token_s1}"}
    )
    assert response.status_code == 403
