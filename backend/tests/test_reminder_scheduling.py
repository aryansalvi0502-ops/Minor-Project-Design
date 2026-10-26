import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.core.security import create_access_token
from backend.app.models.user import User

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

def test_schedule_valid_future_reminder(client, student_auth_headers):
    """
    Test 1: A valid future reminder using the exact form payload:
    title, reminder_type, channel, due_at.
    """
    future_time = (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    payload = {
        "title": "Complete Dynamic Programming Lab",
        "reminder_type": "StudySession",
        "channel": "in_app",
        "due_at": future_time
    }
    res = client.post("/api/v1/notifications/reminders", json=payload, headers=student_auth_headers)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["id"] is not None
    assert data["title"] == "Complete Dynamic Programming Lab"
    assert data["reminder_type"] == "StudySession"
    assert data["channel"] == "in_app"
    assert data["is_active"] is True
    assert data["is_completed"] is False
    assert "due_at" in data
    assert "target_date" in data

    # Verify Active Reminders list returns it
    list_res = client.get("/api/v1/notifications/reminders", headers=student_auth_headers)
    assert list_res.status_code == 200
    reminders = list_res.json()
    assert any(r["id"] == data["id"] for r in reminders)

    # Clean up
    client.delete(f"/api/v1/notifications/reminders/{data['id']}", headers=student_auth_headers)

def test_schedule_empty_title_validation(client, student_auth_headers):
    """
    Test 2: Empty title should fail with clear validation error.
    """
    future_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    payload = {
        "title": "   ",
        "reminder_type": "Assignment",
        "channel": "in_app",
        "due_at": future_time
    }
    res = client.post("/api/v1/notifications/reminders", json=payload, headers=student_auth_headers)
    assert res.status_code in [400, 422]
    res_str = res.text.lower()
    assert "title" in res_str or "empty" in res_str

def test_schedule_invalid_datetime(client, student_auth_headers):
    """
    Test 2b: Invalid datetime format should fail validation.
    """
    payload = {
        "title": "Study Group Check",
        "reminder_type": "StudySession",
        "channel": "in_app",
        "due_at": "not-a-valid-datetime"
    }
    res = client.post("/api/v1/notifications/reminders", json=payload, headers=student_auth_headers)
    assert res.status_code in [400, 422]

def test_schedule_past_datetime_validation(client, student_auth_headers):
    """
    Test 3: Past datetime should fail validation with message indicating future required.
    """
    past_time = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    payload = {
        "title": "Past Assignment",
        "reminder_type": "Assignment",
        "channel": "in_app",
        "due_at": past_time
    }
    res = client.post("/api/v1/notifications/reminders", json=payload, headers=student_auth_headers)
    assert res.status_code in [400, 422]
    res_str = res.text.lower()
    assert "future" in res_str

def test_schedule_unauthenticated_request(client):
    """
    Test 4: Missing or expired authentication should return 401 Unauthorized.
    """
    future_time = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    payload = {
        "title": "Unauthorized Reminder",
        "reminder_type": "StudySession",
        "channel": "in_app",
        "due_at": future_time
    }
    res = client.post("/api/v1/notifications/reminders", json=payload)
    assert res.status_code == 401

    # Also with invalid token
    res_bad = client.post(
        "/api/v1/notifications/reminders",
        json=payload,
        headers={"Authorization": "Bearer invalid.expired.token"}
    )
    assert res_bad.status_code == 401

def test_reminder_toggle_and_persistence(client, student_auth_headers):
    """
    Test 5 & 7: Toggle active/completed status and verify persistence.
    """
    future_time = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    create_res = client.post(
        "/api/v1/notifications/reminders",
        json={
            "title": "Verify Toggle Persistence",
            "reminder_type": "Custom",
            "channel": "email",
            "due_at": future_time
        },
        headers=student_auth_headers
    )
    assert create_res.status_code == 201
    rem = create_res.json()
    rem_id = rem["id"]
    assert rem["channel"] == "email"
    assert rem["is_active"] is True

    # Toggle off (complete)
    toggle_res1 = client.patch(f"/api/v1/notifications/reminders/{rem_id}/toggle", headers=student_auth_headers)
    assert toggle_res1.status_code == 200
    toggled = toggle_res1.json()
    assert toggled["is_completed"] is True
    assert toggled["is_active"] is False

    # Fetch again to verify persistence in database
    get_res = client.get("/api/v1/notifications/reminders", headers=student_auth_headers)
    persisted = next(r for r in get_res.json() if r["id"] == rem_id)
    assert persisted["is_completed"] is True
    assert persisted["is_active"] is False

    # Clean up
    del_res = client.delete(f"/api/v1/notifications/reminders/{rem_id}", headers=student_auth_headers)
    assert del_res.status_code == 204
