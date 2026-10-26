import time
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import require_role
from backend.app.models.user import User
from backend.app.models.prediction import PredictionRecord
from backend.app.models.audit import AuditEvent
from backend.app.models.model_version import ModelVersionMetadata
from backend.app.schemas.user import UserOut, UserRoleUpdate
from backend.app.schemas.admin import (
    SystemHealthOut,
    AuditLogOut,
    ModelMetadataOut,
    ThresholdConfigUpdate,
    RetrainModelRequest
)
from backend.app.services.audit_service import log_audit_event
from backend.app.services.risk_service import risk_service
from ml.prediction.predictor import prediction_service
from ml.prediction.explainer import explainer_service
from ml.training.train import run_training_pipeline

router = APIRouter()
START_TIME = time.time()

@router.get("/system-health", response_model=SystemHealthOut)
def get_system_health(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user_count = db.query(User).count()
    pred_count = db.query(PredictionRecord).count()
    
    return SystemHealthOut(
        status="operational",
        database_connected=True,
        active_model_loaded=prediction_service.is_ready,
        model_version=prediction_service.model_version,
        registered_users=user_count,
        total_predictions=pred_count,
        uptime_seconds=round(time.time() - START_TIME, 1),
        environment=settings.ENV
    )

@router.get("/users", response_model=List[UserOut])
def list_system_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    
    users = query.order_by(User.id.asc()).offset(skip).limit(limit).all()
    return users

@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    old_role = user.role
    user.role = role_update.role
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        action="USER_ROLE_CHANGED",
        resource_type="user",
        resource_id=str(user.id),
        user_id=current_user.id,
        details={"old_role": old_role, "new_role": user.role}
    )

    return user

@router.put("/users/{user_id}/status", response_model=UserOut)
def toggle_user_active_status(
    user_id: int,
    is_active: bool = Query(...),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.is_active = is_active
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        action="USER_STATUS_TOGGLED",
        resource_type="user",
        resource_id=str(user.id),
        user_id=current_user.id,
        details={"is_active": is_active}
    )

    return user

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    action: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if action:
        query = query.filter(AuditEvent.action == action)
    
    logs = query.order_by(AuditEvent.created_at.desc()).offset(skip).limit(limit).all()
    
    # Map user emails
    result = []
    for l in logs:
        user_email = l.user.email if l.user else None
        result.append(AuditLogOut(
            id=l.id,
            user_id=l.user_id,
            user_email=user_email,
            action=l.action,
            resource_type=l.resource_type,
            resource_id=l.resource_id,
            ip_address=l.ip_address,
            details=l.details,
            created_at=l.created_at
        ))
    return result

@router.post("/retrain", response_model=ModelMetadataOut)
def retrain_model_pipeline(
    req: RetrainModelRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Triggers reproduction and validation of the training pipeline, updating active model version.
    """
    try:
        metadata = run_training_pipeline(preferred_algo=req.selected_algorithm)
        # Reload live predictor and explainer singletons
        prediction_service.reload()
        explainer_service.reload()

        log_audit_event(
            db=db,
            action="MODEL_RETRAINED",
            resource_type="model_version",
            resource_id=metadata["version_tag"],
            user_id=current_user.id,
            details={"algorithm": req.selected_algorithm, "test_f1": metadata["metrics_test"]["f1"]}
        )

        model_record = db.query(ModelVersionMetadata).filter(
            ModelVersionMetadata.version_tag == metadata["version_tag"]
        ).first()

        if not model_record:
            raise HTTPException(status_code=500, detail="Retrained model metadata record could not be read.")

        return model_record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retraining execution failed: {str(e)}"
        )

@router.put("/thresholds", response_model=ThresholdConfigUpdate)
def update_risk_thresholds(
    thresholds_in: ThresholdConfigUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    if thresholds_in.low_threshold >= thresholds_in.medium_threshold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Low threshold must be strictly less than medium threshold."
        )

    risk_service.low_threshold = thresholds_in.low_threshold
    risk_service.medium_threshold = thresholds_in.medium_threshold

    log_audit_event(
        db=db,
        action="THRESHOLDS_UPDATED",
        resource_type="configuration",
        resource_id="risk_thresholds",
        user_id=current_user.id,
        details={"low_threshold": thresholds_in.low_threshold, "medium_threshold": thresholds_in.medium_threshold}
    )

    return thresholds_in
