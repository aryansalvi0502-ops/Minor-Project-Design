from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import ConfigDict, BaseModel, Field

class SystemHealthOut(BaseModel):
    status: str
    database_connected: bool
    active_model_loaded: bool
    model_version: Optional[str] = None
    registered_users: int
    total_predictions: int
    uptime_seconds: float
    environment: str

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ModelMetadataOut(BaseModel):
    id: int
    version_tag: str
    algorithm_name: str
    is_active: bool
    training_date: datetime
    dataset_version: str
    dataset_rows: int
    features_used: List[str]
    metrics_train: Dict[str, Any]
    metrics_val: Dict[str, Any]
    metrics_test: Dict[str, Any]
    selected_threshold: float
    calibration_method: Optional[str] = None
    limitations_notes: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ThresholdConfigUpdate(BaseModel):
    low_threshold: float = Field(..., ge=0.0, le=100.0)
    medium_threshold: float = Field(..., ge=0.0, le=100.0)

class RetrainModelRequest(BaseModel):
    selected_algorithm: Optional[str] = Field(default="random_forest", pattern="^(logistic_regression|random_forest|xgboost)$")
    calibrate: bool = True
