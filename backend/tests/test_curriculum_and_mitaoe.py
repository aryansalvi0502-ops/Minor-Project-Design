import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.curriculum import InstitutionProgram, OfficialCourse, StudentCourseEnrollment

client = TestClient(app)

def get_auth_token(email: str, password: str = "AdvisorPass123!") -> str:
    pwd = "StudentPass123!" if "student" in email else ("AdminPass123!" if "admin" in email else password)
    res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

def test_mitaoe_programs_catalog():
    """Verify official MITAOE programs are registered and accessible."""
    res = client.get("/api/v1/curriculum/programs")
    assert res.status_code == 200
    programs = res.json()
    assert len(programs) >= 8
    names = [p["program_name"] for p in programs]
    assert "Computer Engineering" in names
    assert "Computer Science & Engineering (Artificial Intelligence and Machine Learning)" in names
    assert "Information Technology" in names
    assert all(p["institution"] == "MITAOE" for p in programs)

def test_mitaoe_courses_filtering():
    """Verify course structure returns semester-specific official courses."""
    res = client.get("/api/v1/curriculum/courses?program_name=Computer Engineering&semester=3")
    assert res.status_code == 200
    courses = res.json()
    assert len(courses) >= 4
    codes = [c["course_code"] for c in courses]
    assert "CS201" in codes # Data Structures & Algorithms
    assert "CS202" in codes # Discrete Mathematics
    assert "ET206" in codes # Digital Electronics
    assert all(c["institution"] == "MITAOE" for c in courses)
    assert all(c["semester"] == 3 for c in courses)

def test_student_enrollments_lifecycle():
    """Test student can retrieve and confirm courses for their semester."""
    token = get_auth_token("student@university.edu")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch current enrollments
    res = client.get("/api/v1/curriculum/my-enrollments", headers=headers)
    assert res.status_code == 200
    enrollments = res.json()
    assert len(enrollments) >= 1

    # 2. Add an elective course
    new_enroll = {
        "course_code": "CS311",
        "course_title": "Elective I: Artificial Intelligence & Expert Systems",
        "semester": 5,
        "enrollment_type": "Elective",
        "is_confirmed": True,
        "confidence_level": "Medium",
        "difficult_topics": ["State-Space Search", "A* Algorithm"],
        "academic_goal": "Target Grade A (80%+)"
    }
    res_add = client.post("/api/v1/curriculum/my-enrollments", json=new_enroll, headers=headers)
    assert res_add.status_code in [200, 201]
    added_id = res_add.json()["id"]

    # 3. Update confidence & goals
    res_up = client.put(f"/api/v1/curriculum/my-enrollments/{added_id}", json={
        "confidence_level": "High",
        "academic_goal": "Distinction 90%+"
    }, headers=headers)
    assert res_up.status_code == 200
    assert res_up.json()["confidence_level"] == "High"

    # 4. Cleanup
    res_del = client.delete(f"/api/v1/curriculum/my-enrollments/{added_id}", headers=headers)
    assert res_del.status_code == 204

def test_admin_curriculum_import_and_role_protection():
    """Test admin can import courses with validation and deduplication, but student is forbidden."""
    student_token = get_auth_token("student@university.edu")
    admin_token = get_auth_token("admin@university.edu")

    import_payload = {
        "courses": [
            {
                "program_name": "Information Technology",
                "semester": 6,
                "course_code": "IT321",
                "course_title": "DevOps & Cloud Automation",
                "credits": 3.0,
                "course_type": "Core",
                "curriculum_version": "Autonomous 2022",
                "syllabus_topics": ["Docker", "Kubernetes", "GitHub Actions", "Terraform"],
                "source_url": "https://mitaoe.ac.in/BTECH/"
            }
        ]
    }

    # Student cannot import
    res_stud = client.post("/api/v1/curriculum/admin/import", json=import_payload, headers={"Authorization": f"Bearer {student_token}"})
    assert res_stud.status_code == 403

    # Admin can import
    res_admin = client.post("/api/v1/curriculum/admin/import", json=import_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert data["total_processed"] == 1
    assert data["imported_count"] + data["updated_count"] == 1

def test_chatbot_uses_mitaoe_context():
    """Test chatbot answers query with student's MITAOE enrolled courses and advisor details."""
    token = get_auth_token("student@university.edu")
    headers = {"Authorization": f"Bearer {token}"}

    # Query 1: What should I study today
    res = client.post("/api/v1/support/chat", json={"message": "What should I study today?"}, headers=headers)
    assert res.status_code == 200
    reply = res.json()["reply"]
    assert "MITAOE" in reply or "Study Focus" in reply

    # Query 2: Which subjects need more attention
    res2 = client.post("/api/v1/support/chat", json={"message": "Which of my current subjects needs more attention?"}, headers=headers)
    assert res2.status_code == 200
    assert len(res2.json()["reply"]) > 50

    # Query 3: Advisor consultation check
    res3 = client.post("/api/v1/support/chat", json={"message": "I want to speak to a human advisor"}, headers=headers)
    assert res3.status_code == 200
    assert res3.json()["escalate_to_human"] == True
    assert "Disha Malpure Ma'am" in res3.json()["reply"] or "Advisor" in res3.json()["reply"]
