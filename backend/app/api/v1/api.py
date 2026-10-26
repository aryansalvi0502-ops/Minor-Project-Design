from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    auth,
    profiles,
    predictions,
    recovery,
    advisor,
    analytics,
    admin,
    notifications,
    support,
    curriculum
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Student Profiles"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["ML Predictions & Explainability"])
api_router.include_router(recovery.router, prefix="/recovery", tags=["Personalized Recovery Plans"])
api_router.include_router(advisor.router, prefix="/advisor", tags=["Faculty Advisor Workflows"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Management Analytics"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration & Governance"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["In-App Notifications"])
api_router.include_router(support.router, prefix="/support", tags=["Student Support Systems"])
api_router.include_router(curriculum.router, prefix="/curriculum", tags=["MITAOE Curriculum & Enrollments"])
