import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.core.security import get_password_hash
from backend.app.models.user import User

# In-memory SQLite for isolated auth test
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
def setup_auth_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()

    users = [
        User(email="test.student@udaan.edu", hashed_password=get_password_hash("StudentPass123!"), full_name="Aarav Student", role="student", is_active=True),
        User(email="test.advisor@udaan.edu", hashed_password=get_password_hash("AdvisorPass123!"), full_name="Prof. Advisor", role="advisor", is_active=True),
        User(email="test.mgmt@udaan.edu", hashed_password=get_password_hash("ManagePass123!"), full_name="Dean Management", role="management", is_active=True),
        User(email="test.admin@udaan.edu", hashed_password=get_password_hash("AdminPass123!"), full_name="Admin User", role="admin", is_active=True),
        User(email="deactivated@udaan.edu", hashed_password=get_password_hash("DeactivatedPass123!"), full_name="Deactivated User", role="student", is_active=False),
    ]
    db.add_all(users)
    db.commit()

    yield

    app.dependency_overrides.pop(get_db, None)

client = TestClient(app)

def test_login_successful_all_roles():
    test_cases = [
        ("test.student@udaan.edu", "StudentPass123!", "student", "Aarav Student"),
        ("test.advisor@udaan.edu", "AdvisorPass123!", "advisor", "Prof. Advisor"),
        ("test.mgmt@udaan.edu", "ManagePass123!", "management", "Dean Management"),
        ("test.admin@udaan.edu", "AdminPass123!", "admin", "Admin User"),
    ]

    for email, password, expected_role, expected_name in test_cases:
        res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, f"Login failed for {email}: {res.text}"
        data = res.json()

        # Validate token fields
        assert "access_token" in data, "access_token missing from response"
        assert "token" in data, "token alias missing from response"
        assert data["token"] == data["access_token"]
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 20

        # Validate user object
        assert "user" in data, "user object missing from response"
        user = data["user"]
        assert user["email"] == email
        assert user["role"] == expected_role
        assert user["full_name"] == expected_name
        assert "id" in user
        assert user["is_active"] is True

        # Verify session using returned access_token on protected /auth/me
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == email

def test_login_incorrect_password():
    res = client.post("/api/v1/auth/login", json={"email": "test.student@udaan.edu", "password": "WrongPassword"})
    assert res.status_code == 401
    data = res.json()
    assert "detail" in data
    assert "Incorrect email or password." in data["detail"]

def test_login_nonexistent_email():
    res = client.post("/api/v1/auth/login", json={"email": "nobody@nowhere.edu", "password": "AnyPassword123!"})
    assert res.status_code == 401
    data = res.json()
    assert "detail" in data
    assert "Incorrect email or password." in data["detail"]

def test_login_deactivated_account():
    res = client.post("/api/v1/auth/login", json={"email": "deactivated@udaan.edu", "password": "DeactivatedPass123!"})
    assert res.status_code == 400
    data = res.json()
    assert "deactivated" in data["detail"].lower()

def test_protected_endpoints_require_token():
    # Without Authorization header
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401

    # With invalid Bearer token
    res2 = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
    assert res2.status_code == 401
