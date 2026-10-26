from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_support_system_unauthorized():
    # Chat requires authentication
    res = client.post("/api/v1/support/chat", json={"message": "Hello"})
    assert res.status_code == 401

    # Advisor info requires authentication
    res = client.get("/api/v1/support/advisor-info")
    assert res.status_code == 401

def test_support_system_chat_and_ticket():
    # 1. Login as student
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "student@university.edu", "password": "StudentPass123!"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Advisor Info
    adv_res = client.get("/api/v1/support/advisor-info", headers=headers)
    assert adv_res.status_code == 200
    adv_data = adv_res.json()
    assert "email" in adv_data
    assert "office_hours" in adv_data
    assert isinstance(adv_data["available_modalities"], list)

    # 3. AI Chatbot assistance
    chat_res = client.post(
        "/api/v1/support/chat",
        json={"message": "Can you help me raise my GPA and organize a study timetable?"},
        headers=headers
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "reply" in chat_data
    assert len(chat_data["reply"]) > 50
    assert "suggested_prompts" in chat_data
    assert chat_data["escalate_to_human"] is False

    # 4. AI Chatbot safety escalation detection
    crisis_res = client.post(
        "/api/v1/support/chat",
        json={"message": "I feel hopeless and I want to give up completely"},
        headers=headers
    )
    assert crisis_res.status_code == 200
    crisis_data = crisis_res.json()
    assert crisis_data["escalate_to_human"] is True
    assert "988" in crisis_data["reply"] or "lifeline" in crisis_data["reply"].lower() or "counseling" in crisis_data["reply"].lower()

    # 5. Submit Human Support Ticket
    ticket_payload = {
        "topic": "Academic Standing Review",
        "urgency": "Normal",
        "notes": "Would like to discuss my 10-scale GPA trajectory and course load for next semester."
    }
    ticket_res = client.post(
        "/api/v1/support/request-human-support",
        json=ticket_payload,
        headers=headers
    )
    assert ticket_res.status_code == 200
    created_ticket = ticket_res.json()
    assert created_ticket["topic"] == "Academic Standing Review"
    assert created_ticket["status"] == "requested_by_student"

    # 6. Retrieve Tickets
    my_tix_res = client.get("/api/v1/support/my-tickets", headers=headers)
    assert my_tix_res.status_code == 200
    tix_list = my_tix_res.json()
    assert len(tix_list) >= 1
    assert any(t["topic"] == "Academic Standing Review" for t in tix_list)
