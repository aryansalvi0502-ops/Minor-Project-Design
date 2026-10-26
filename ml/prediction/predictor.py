import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List
from backend.app.services.risk_service import risk_service
from backend.app.core.config import settings

class PredictionService:
    _instance = None
    _pipeline = None
    _metadata = None
    _is_ready = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PredictionService, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        pipeline_path = os.path.join(settings.MODEL_ARTIFACTS_DIR, "student_dropout_pipeline.joblib")
        meta_path = os.path.join(settings.MODEL_ARTIFACTS_DIR, "metadata.json")

        if os.path.exists(pipeline_path) and os.path.exists(meta_path):
            try:
                self._pipeline = joblib.load(pipeline_path)
                with open(meta_path, "r", encoding="utf-8") as f:
                    self._metadata = json.load(f)
                self._is_ready = True
                print(f"[ML Service] Successfully loaded model {self._metadata.get('version_tag')} into memory.")
            except Exception as e:
                print(f"[ML Service ERROR] Failed to load model pipeline: {e}")
                self._pipeline = None
                self._metadata = None
                self._is_ready = False
        else:
            print("[ML Service] Model artifacts not found. Model status: UNTRAINED")
            self._pipeline = None
            self._metadata = None
            self._is_ready = False

    def reload(self):
        self._load_model()

    @property
    def is_ready(self) -> bool:
        return self._is_ready

    @property
    def metadata(self) -> Dict[str, Any]:
        return self._metadata or {}

    @property
    def model_version(self) -> str:
        return self._metadata.get("version_tag", "untrained") if self._metadata else "untrained"

    @property
    def selected_threshold(self) -> float:
        return float(self._metadata.get("selected_threshold", 0.50)) if self._metadata else 0.50

    def predict_student_risk(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        if not self._is_ready or self._pipeline is None:
            raise RuntimeError("Machine Learning model is not available or has not been trained yet.")

        # Ensure input data matches training columns and normalize 10-point scale if present
        features_order = self._metadata["features_used"]
        input_row = {}
        for feat in features_order:
            val = feature_dict.get(feat, None)
            if feat in ["GPA", "Semester_GPA", "CGPA"] and val is not None and float(val) > 4.0:
                val = round(float(val) / 10.0 * 4.0, 3)
            input_row[feat] = val
        df_input = pd.DataFrame([input_row])

        # Generate calibrated probability
        probabilities = self._pipeline.predict_proba(df_input)[0]
        # Binary target: 1 = Dropout probability
        dropout_prob = float(probabilities[1])
        risk_score = risk_service.calculate_score(dropout_prob)
        risk_category = risk_service.classify_risk(risk_score)

        return {
            "dropout_probability": round(dropout_prob, 4),
            "risk_score": risk_score,
            "risk_category": risk_category,
            "threshold_used": self.selected_threshold,
            "model_version": self.model_version,
            "features_snapshot": input_row
        }

prediction_service = PredictionService()
