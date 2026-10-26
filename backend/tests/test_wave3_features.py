import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.core.security import create_access_token
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.recovery import RecoveryPlan, RecoveryTask
from backend.app.models.advisor import AdvisorIntervention
from backend.app.models.timetable import StudentDeadline

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

def test_prioritized_next_actions_endpoint(client, student_auth_headers):
    response = client.get("/api/v1/recovery/prioritized-actions", headers=student_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "actions" in data
    assert len(data["actions"]) == 3
    assert data["actions"][0]["rank"] == 1
    assert data["actions"][1]["rank"] == 2
    assert data["actions"][2]["rank"] == 3
    for act in data["actions"]:
        assert "title" in act
        assert "rationale" in act
        assert "cta_text" in act
        assert "category" in act

def test_recovery_task_toggle_and_milestones(client, student_auth_headers):
    db = SessionLocal()
    plan = db.query(RecoveryPlan).first()
    assert plan is not None
    task = db.query(RecoveryTask).filter(RecoveryTask.plan_id == plan.id).first()
    assert task is not None
    task_id = task.id
    db.close()

    # Toggle task to completed
    res = client.put(
        f"/api/v1/recovery/tasks/{task_id}/toggle",
        json={"is_completed": True},
        headers=student_auth_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert "completion_rate" in data
    assert data["completion_rate"] > 0.0

def test_adaptive_timetable_and_deadlines(client, student_auth_headers):
    # 1. Get timetable
    res = client.get("/api/v1/recovery/timetable", headers=student_auth_headers)
    assert res.status_code == 200
    tt = res.json()
    assert "generated_timetable" in tt
    assert "Monday" in tt["generated_timetable"]

    # 2. Add deadline
    deadline_payload = {
        "title": "Machine Learning Term Project",
        "subject_code": "CS201",
        "deadline_type": "project",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "estimated_hours_needed": 6.0
    }
    res_dl = client.post("/api/v1/recovery/timetable/deadlines", json=deadline_payload, headers=student_auth_headers)
    assert res_dl.status_code == 201
    dl_data = res_dl.json()
    dl_id = dl_data["id"]
    assert dl_data["title"] == "Machine Learning Term Project"

    # 3. Toggle deadline
    res_toggle = client.patch(f"/api/v1/recovery/timetable/deadlines/{dl_id}/toggle", headers=student_auth_headers)
    assert res_toggle.status_code == 200
    assert res_toggle.json()["is_completed"] is True

    # 4. Delete deadline
    res_del = client.delete(f"/api/v1/recovery/timetable/deadlines/{dl_id}", headers=student_auth_headers)
    assert res_del.status_code == 204

def test_verified_learning_resources_endpoint(client, student_auth_headers):
    res = client.get("/api/v1/recovery/resources", headers=student_auth_headers)
    assert res.status_code == 200
    resources = res.json()
    assert isinstance(resources, list)
    assert len(resources) >= 1
    assert "title" in resources[0]
    assert "provider" in resources[0]
    assert resources[0]["is_verified"] is True

def test_notification_preferences_and_reminders(client, student_auth_headers):
    # 1. Get preferences
    res_pref = client.get("/api/v1/notifications/preferences", headers=student_auth_headers)
    assert res_pref.status_code == 200
    pref = res_pref.json()
    assert "assignment_reminders" in pref

    # 2. Update preferences
    res_up = client.put(
        "/api/v1/notifications/preferences",
        json={"assignment_lead_hours": 36, "daily_study_reminders": True},
        headers=student_auth_headers
    )
    assert res_up.status_code == 200
    assert res_up.json()["assignment_lead_hours"] == 36

    # 3. Create reminder
    rem_payload = {
        "title": "Review Binary Search Trees before Friday quiz",
        "reminder_type": "study",
        "target_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    }
    res_rem = client.post("/api/v1/notifications/reminders", json=rem_payload, headers=student_auth_headers)
    assert res_rem.status_code == 201
    rem_data = res_rem.json()
    rem_id = rem_data["id"]

    # 4. Toggle reminder
    res_toggle = client.patch(f"/api/v1/notifications/reminders/{rem_id}/toggle", headers=student_auth_headers)
    assert res_toggle.status_code == 200
    assert res_toggle.json()["is_completed"] is True

    # 5. Delete reminder
    res_del = client.delete(f"/api/v1/notifications/reminders/{rem_id}", headers=student_auth_headers)
    assert res_del.status_code == 204

def test_support_feedback_endpoint(client, student_auth_headers, advisor_auth_headers):
    fb_payload = {
        "feedback_type": "recovery_plan",
        "target_id": 1,
        "target_title": "Academic Recovery Plan",
        "rating": 5,
        "effectiveness": "Highly Effective",
        "comments": "The 2x45 min study sessions really improved my focus."
    }
    res = client.post("/api/v1/support/feedback", json=fb_payload, headers=student_auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["rating"] == 5
    assert data["effectiveness"] == "Highly Effective"

    # Advisor feedback summary
    res_sum = client.get("/api/v1/advisor/feedback-summary", headers=advisor_auth_headers)
    assert res_sum.status_code == 200
    summary = res_sum.json()
    assert "average_rating" in summary
    assert summary["total_reviews"] >= 1

def test_advisor_appointment_lifecycle(client, student_auth_headers, advisor_auth_headers):
    # 1. Student requests appointment
    req_payload = {
        "topic": "Academic Recovery Strategy Review",
        "urgency": "High",
        "modality": "Video Consultation",
        "notes": "Need assistance organizing midterm study schedule for CS201 and MATH205.",
        "preferred_date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    }
    res_req = client.post("/api/v1/support/request-human-support", json=req_payload, headers=student_auth_headers)
    assert res_req.status_code == 200
    ticket = res_req.json()
    ticket_id = ticket["id"]
    assert ticket["status"] == "requested_by_student"
    assert ticket["urgency"] == "High"

    # 2. Advisor confirms appointment
    confirm_payload = {
        "meeting_date": (datetime.now(timezone.utc) + timedelta(days=3, hours=2)).isoformat(),
        "meeting_link_or_location": "https://university.zoom.us/j/987654321",
        "advisor_notes": "Confirmed consultation. Student requested prep on CS201 and MATH205."
    }
    res_conf = client.patch(
        f"/api/v1/advisor/appointments/{ticket_id}/confirm",
        json=confirm_payload,
        headers=advisor_auth_headers
    )
    assert res_conf.status_code == 200
    conf_data = res_conf.json()
    assert conf_data["status"] == "scheduled"
    assert conf_data["meeting_link_or_location"] == "https://university.zoom.us/j/987654321"

    # 3. Advisor completes appointment
    complete_payload = {
        "action_taken": "Conducted 45-min Zoom strategy session. Structured 4-week timetable and identified CS201 tree recursion gaps.",
        "follow_up_notes": "Student will solve 5 practice problems from MIT 6.006 resource and report back next Tuesday.",
        "follow_up_tasks": "['Complete Tree practice sets', 'Log 2x45-min study sessions']"
    }
    res_comp = client.patch(
        f"/api/v1/advisor/appointments/{ticket_id}/complete",
        json=complete_payload,
        headers=advisor_auth_headers
    )
    assert res_comp.status_code == 200
    comp_data = res_comp.json()
    assert comp_data["status"] == "completed"
    assert "Conducted 45-min Zoom" in comp_data["action_taken"]
    assert "MIT 6.006" in comp_data["follow_up_notes"]
