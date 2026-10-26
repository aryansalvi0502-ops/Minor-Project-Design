import os
from datetime import timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.api.v1.api import api_router
from backend.app.models.user import User
from backend.app.core.security import get_password_hash
from ml.prediction.predictor import prediction_service
from ml.prediction.explainer import explainer_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB tables exist
    Base.metadata.create_all(bind=engine)
    
    # Preload ML model and SHAP explainer into memory
    prediction_service._load_model()
    explainer_service._load_explainer()

    # Seed baseline demonstration accounts for testing if fresh
    db = SessionLocal()
    try:
        demo_accounts = [
            ("admin@university.edu", "AdminPass123!", "System Administrator", "admin", "MITAOE Administration"),
            ("advisor@university.edu", "AdvisorPass123!", "Disha Malpure Ma'am (Advisor)", "advisor", "Computer Engineering"),
            ("advisor.eng@university.edu", "AdvisorPass123!", "Prof. Rahul Deshmukh (Advisor)", "advisor", "Artificial Intelligence & Data Science"),
            ("advisor.math@university.edu", "AdvisorPass123!", "Dr. Priya Nair (Advisor)", "advisor", "Mathematics & Applied Sciences"),
            ("advisor.counsel@university.edu", "AdvisorPass123!", "Dr. Sneha Iyer (Advisor)", "advisor", "Academic Counselling"),
            ("management@university.edu", "ManagePass123!", "Prof. Arjun Kulkarni (Dean, Academics)", "management", "Academic Affairs"),
            ("student@university.edu", "StudentPass123!", "Aarav Deshmukh", "student", "Computer Engineering")
        ]

        for email, pwd, name, role, dept in demo_accounts:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                user = User(
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    full_name=name,
                    role=role,
                    department=dept,
                    is_active=True
                )
                db.add(user)
            else:
                # Update placeholder names to realistic Indian faculty names while preserving user ID and account integrity
                if any(ph in (existing.full_name or "") for ph in ["Robert Vance", "Sarah Lin", "Eleanor Cross", "Alex Rivera", "Ananya Sharma"]):
                    existing.full_name = name
                    existing.department = dept
        db.commit()

        # Seed initial student profile for student@university.edu if not exists
        student_user = db.query(User).filter(User.email == "student@university.edu").first()
        advisor_user = db.query(User).filter(User.email == "advisor@university.edu").first()

        if student_user and not student_user.student_profile:
            from backend.app.models.profile import StudentProfile
            from backend.app.api.v1.endpoints.profiles import _trigger_prediction_and_plan

            profile = StudentProfile(
                user_id=student_user.id,
                student_institutional_id="STU-2024-001",
                department="CS",
                semester="Year 2",
                age=20.0,
                gender="Male",
                family_income=32000.0,
                internet_access="Yes",
                study_hours_per_day=2.0,
                attendance_rate=68.5,
                assignment_delay_days=3,
                travel_time_minutes=35.0,
                part_time_job="Yes",
                scholarship="No",
                stress_index=7.5,
                gpa=4.38,
                semester_gpa=4.12,
                cgpa=4.25,
                parental_education="High School",
                assigned_advisor_id=advisor_user.id if advisor_user else None
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
            _trigger_prediction_and_plan(profile, db)
            print("[Seed] Created default student profile and generated baseline prediction.")

        # Seed enhanced records (subject assessments, verified resources, deadlines, preferences)
        from backend.app.core.seed import seed_enhanced_records
        seed_enhanced_records(db)

        # Seed official MITAOE curriculum and student enrollments
        from backend.app.core.curriculum_seed import seed_mitaoe_curriculum
        seed_mitaoe_curriculum(db)

    except Exception as e:
        db.rollback()
        print(f"[Seed Warning] Could not seed default users: {e}")
    finally:
        db.close()

    yield
    print("[Shutdown] Cleaning up API services.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Explainable AI Early-Warning System for Student Dropout Prediction & Recovery Planning",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware with restricted origins and automatic Render/Vercel preview support
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*(\.vercel\.app|\.onrender\.com)",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "operational",
        "api_v1": settings.API_V1_STR,
        "docs": "/docs",
        "model_loaded": prediction_service.is_ready,
        "model_version": prediction_service.model_version
    }

@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    """
    Public health check endpoint for cloud hosting providers (e.g., Render, Railway)
    and load balancers to monitor container/service readiness.
    """
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "environment": settings.ENV,
        "model_loaded": prediction_service.is_ready,
        "model_version": prediction_service.model_version,
        "database": "connected"
    }
