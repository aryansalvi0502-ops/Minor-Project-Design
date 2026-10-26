from typing import Tuple
from backend.app.core.config import settings

class RiskClassificationService:
    """
    Centralized, reusable risk classification service.
    Enforces consistent risk categories and threshold mapping across API and dashboards.
    """
    def __init__(self, low_threshold: float = None, medium_threshold: float = None):
        self.low_threshold = low_threshold if low_threshold is not None else settings.DEFAULT_LOW_THRESHOLD
        self.medium_threshold = medium_threshold if medium_threshold is not None else settings.DEFAULT_MEDIUM_THRESHOLD

    def calculate_score(self, dropout_probability: float) -> float:
        """
        Converts probability (0.0 to 1.0) into a calibrated risk score out of 100.
        """
        score = round(float(dropout_probability) * 100.0, 1)
        return max(0.0, min(100.0, score))

    def classify_risk(self, risk_score: float) -> str:
        """
        Categorizes risk score into Low, Medium, or High risk.
        Provisional thresholds:
          - Low risk: 0 <= score < low_threshold (e.g. < 30)
          - Medium risk: low_threshold <= score < medium_threshold (e.g. 30 - 59.9)
          - High risk: score >= medium_threshold (e.g. 60 - 100)
        """
        if risk_score < self.low_threshold:
            return "Low"
        elif risk_score < self.medium_threshold:
            return "Medium"
        else:
            return "High"

    def get_tier_action_policy(self, risk_category: str) -> dict:
        """
        Defines non-punitive, supportive intervention tiers.
        """
        if risk_category == "High":
            return {
                "support_level": "Priority Human Support",
                "recommended_cadence": "Weekly Advisor Check-ins",
                "focus": "Urgent academic, personal, or financial barrier resolution",
                "stigmatizing": False,
                "badge_color": "danger"
            }
        elif risk_category == "Medium":
            return {
                "support_level": "Targeted Academic Support",
                "recommended_cadence": "Bi-weekly Mentoring & Tutoring",
                "focus": "Subject-wise study strategy revision and attendance tracking",
                "stigmatizing": False,
                "badge_color": "warning"
            }
        else:
            return {
                "support_level": "Preventive Guidance",
                "recommended_cadence": "Routine Semester Monitoring",
                "focus": "Academic enrichment, skill building, and milestone celebration",
                "stigmatizing": False,
                "badge_color": "success"
            }

risk_service = RiskClassificationService()
