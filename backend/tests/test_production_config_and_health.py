import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import Settings

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "api_v1" in data

def test_health_check_endpoints():
    # Test root /health
    res1 = client.get("/health")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "healthy"
    assert "environment" in data1
    assert "model_loaded" in data1

    # Test /api/v1/health
    res2 = client.get("/api/v1/health")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "healthy"
    assert data2["system"] == data1["system"]

def test_cors_origins_validator():
    # Comma-separated string with whitespace and trailing slash
    raw_csv = "https://minor-project-design.vercel.app/, http://localhost:5173/ "
    parsed = Settings.assemble_cors_origins(raw_csv)
    assert parsed == [
        "https://minor-project-design.vercel.app",
        "http://localhost:5173"
    ]

    # JSON formatted list
    raw_json = '["https://minor-project-design.vercel.app", "http://localhost:3000/"]'
    parsed_json = Settings.assemble_cors_origins(raw_json)
    assert "https://minor-project-design.vercel.app" in parsed_json

def test_database_url_postgres_normalization():
    # Render / Supabase postgres:// URI
    postgres_url = "postgres://udaan_user:secretpass@dpg-xxxx.render.com/udaan_db"
    normalized = Settings.assemble_db_connection(postgres_url)
    assert normalized.startswith("postgresql://")
    assert "udaan_user:secretpass" in normalized

    # Standard sqlite URI preserved
    sqlite_url = "sqlite:///./early_warning.db"
    assert Settings.assemble_db_connection(sqlite_url) == sqlite_url
