from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import ConfigDict, BaseModel, Field

class FeatureContributionItem(BaseModel):
    feature: str
    feature_label: str
    value: Any
    shap_value: float
    effect: str # 'increases_risk' or 'decreases_risk'
    importance: float
    description: str

class ExplanationOut(BaseModel):
    base_value: float
    summary_text: str
    feature_contributions: List[FeatureContributionItem]

class PredictionOut(BaseModel):
    id: Optional[int] = None
    student_id: int
    model_version: str
    dropout_probability: float = Field(..., ge=0.0, le=1.0)
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_category: str # 'Low', 'Medium', 'High'
    threshold_used: float
    is_active: bool = True
    prediction_timestamp: datetime
    disclaimer: str = "This score is an empirical probabilistic risk estimate designed to identify proactive academic support needs. It is an association, never a predetermined outcome or punitive judgement."
    explanation: Optional[ExplanationOut] = None

    model_config = ConfigDict(from_attributes=True)

class PredictionHistoryItem(BaseModel):
    id: int
    dropout_probability: float
    risk_score: float
    risk_category: str
    model_version: str
    prediction_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class TrendFactorShift(BaseModel):
    feature: str
    label: str
    previous_value: Any
    current_value: Any
    delta: float
    impact: str # 'increases_risk', 'decreases_risk', 'neutral'
    narrative: str

class PredictionTrendOut(BaseModel):
    current_risk_score: float
    previous_risk_score: Optional[float] = None
    score_delta: Optional[float] = None
    direction: str # 'Improving', 'Deteriorating', 'Stable', 'Initial Baseline'
    velocity_label: str
    total_evaluations: int
    history_timeline: List[PredictionHistoryItem]
    factor_shifts: List[TrendFactorShift]
    trend_narrative: str

class WhatIfSimulationRequest(BaseModel):
    gpa: Optional[float] = Field(None, ge=0.0, le=10.0, description="Hypothetical GPA (0-10)")
    study_hours_per_day: Optional[float] = Field(None, ge=0.0, le=16.0, description="Hypothetical study hours")
    attendance_rate: Optional[float] = Field(None, ge=0.0, le=100.0, description="Hypothetical attendance %")
    assignment_delay_days: Optional[int] = Field(None, ge=0, le=30, description="Hypothetical delay days")
    stress_index: Optional[float] = Field(None, ge=1.0, le=10.0, description="Hypothetical stress index")

class WhatIfSimulationResponse(BaseModel):
    baseline_risk_score: float
    baseline_risk_category: str
    simulated_risk_score: float
    simulated_risk_category: str
    score_delta: float
    simulated_dropout_probability: float
    simulated_parameters: Dict[str, Any]
    academic_standing_tier: str
    top_sensitivity_drivers: List[Dict[str, Any]]
    ethical_disclaimer: str = (
        "Hypothetical projection only. This simulation demonstrates statistical model sensitivity "
        "under altered indicators and does not guarantee specific academic standing or official institutional outcomes. "
        "Academic recovery is multidimensional and supported through personalized advisor guidance."
    )
    # Direct access compatibility aliases
    risk_score: float
    risk_category: str
    dropout_probability: float

