import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List
import shap
from backend.app.core.config import settings

class ExplanationService:
    _instance = None
    _explainer = None
    _preprocessor = None
    _classifier = None
    _bg_data = None
    _is_ready = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ExplanationService, cls).__new__(cls)
            cls._instance._load_explainer()
        return cls._instance

    def _load_explainer(self):
        base_pipeline_path = os.path.join(settings.MODEL_ARTIFACTS_DIR, "base_model_pipeline.joblib")
        shap_bg_path = os.path.join(settings.MODEL_ARTIFACTS_DIR, "shap_background.joblib")

        if os.path.exists(base_pipeline_path) and os.path.exists(shap_bg_path):
            try:
                base_pipe = joblib.load(base_pipeline_path)
                self._bg_data = joblib.load(shap_bg_path)
                self._preprocessor = base_pipe.named_steps["preprocessor"]
                self._classifier = base_pipe.named_steps["classifier"]
                
                algo = self._bg_data.get("algorithm", "logistic_regression")
                if "random_forest" in algo:
                    self._explainer = shap.TreeExplainer(self._classifier)
                elif "xgboost" in algo:
                    self._explainer = shap.TreeExplainer(self._classifier)
                else:
                    self._explainer = shap.LinearExplainer(
                        self._classifier,
                        self._bg_data["background_trans"]
                    )
                self._is_ready = True
                print("[Explainer Service] SHAP Explainer successfully initialized.")
            except Exception as e:
                print(f"[Explainer Service ERROR] Could not initialize SHAP explainer: {e}")
                self._is_ready = False
        else:
            self._is_ready = False

    def reload(self):
        self._load_explainer()

    @property
    def is_ready(self) -> bool:
        return self._is_ready

    def explain_student(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        if not self._is_ready:
            return {
                "base_value": 0.5,
                "summary_text": "Explanations currently unavailable as the underlying explainer is not loaded.",
                "feature_contributions": []
            }

        features_order = self._bg_data["numerical_features"] + self._bg_data["categorical_features"]
        input_row = {}
        for feat in features_order:
            val = feature_dict.get(feat, None)
            if feat in ["GPA", "Semester_GPA", "CGPA"] and val is not None and float(val) > 4.0:
                val = round(float(val) / 10.0 * 4.0, 3)
            input_row[feat] = val
        df_input = pd.DataFrame([input_row])
        
        # Preprocess features
        X_trans = self._preprocessor.transform(df_input)
        feature_names = self._bg_data["feature_names"]

        # Compute SHAP
        shap_explanation = self._explainer(X_trans)
        shap_vals = shap_explanation.values[0]
        
        # Handle binary classification shapes
        if len(shap_vals.shape) > 1 and shap_vals.shape[1] == 2:
            shap_vals = shap_vals[:, 1]

        base_val = float(shap_explanation.base_values[0]) if hasattr(shap_explanation, "base_values") else 0.0
        if isinstance(base_val, (list, np.ndarray)):
            base_val = float(base_val[-1])

        # Aggregate contributions back to original input fields
        contributions = []
        
        # 1. Numerical features (1-to-1)
        for i, num_col in enumerate(self._bg_data["numerical_features"]):
            val = feature_dict.get(num_col, "N/A")
            s_val = float(shap_vals[i])
            contributions.append({
                "feature": num_col,
                "feature_label": num_col.replace("_", " "),
                "value": val,
                "shap_value": round(s_val, 4),
                "effect": "increases_risk" if s_val > 0.001 else ("decreases_risk" if s_val < -0.001 else "neutral"),
                "importance": round(abs(s_val), 4),
                "description": self._describe_effect(num_col, val, s_val)
            })

        # 2. Categorical features (combine OHE values)
        start_cat_idx = len(self._bg_data["numerical_features"])
        cat_encoder = self._preprocessor.named_transformers_["cat"].named_steps["encoder"]
        cat_features_encoded = cat_encoder.get_feature_names_out(self._bg_data["categorical_features"])

        for cat_col in self._bg_data["categorical_features"]:
            val = feature_dict.get(cat_col, "N/A")
            # Sum up SHAP values for this categorical feature family
            cat_shap_sum = 0.0
            for k, enc_name in enumerate(cat_features_encoded):
                if enc_name.startswith(f"{cat_col}_"):
                    cat_shap_sum += float(shap_vals[start_cat_idx + k])

            contributions.append({
                "feature": cat_col,
                "feature_label": cat_col.replace("_", " "),
                "value": val,
                "shap_value": round(cat_shap_sum, 4),
                "effect": "increases_risk" if cat_shap_sum > 0.001 else ("decreases_risk" if cat_shap_sum < -0.001 else "neutral"),
                "importance": round(abs(cat_shap_sum), 4),
                "description": self._describe_effect(cat_col, val, cat_shap_sum)
            })

        # Sort by absolute importance descending
        contributions.sort(key=lambda x: x["importance"], reverse=True)

        # Build natural language summary
        top_risk_drivers = [c["feature_label"] for c in contributions if c["effect"] == "increases_risk"][:3]
        top_protective = [c["feature_label"] for c in contributions if c["effect"] == "decreases_risk"][:2]

        summary_parts = []
        if top_risk_drivers:
            summary_parts.append(f"Primary factors contributing to higher estimated risk: {', '.join(top_risk_drivers)}.")
        if top_protective:
            summary_parts.append(f"Primary protective factors reducing estimated risk: {', '.join(top_protective)}.")
        summary_parts.append("Note: These contributions reflect statistical associations in empirical student outcome records, not deterministic causality.")

        summary_text = " ".join(summary_parts)

        return {
            "base_value": round(base_val, 4),
            "summary_text": summary_text,
            "feature_contributions": contributions
        }

    def _describe_effect(self, feature: str, value: Any, shap_val: float) -> str:
        effect_str = "increases estimated risk" if shap_val > 0 else "reduces estimated risk"
        if feature in ["GPA", "Semester_GPA", "CGPA"]:
            return f"Current academic grade ({value}/4.0) {effect_str}."
        elif feature == "Attendance_Rate":
            return f"Lecture attendance rate of {value}% {effect_str}."
        elif feature == "Assignment_Delay_Days":
            return f"Average submission delay of {value} days {effect_str}."
        elif feature == "Study_Hours_per_Day":
            return f"Self-study commitment of {value} hrs/day {effect_str}."
        elif feature == "Stress_Index":
            return f"Self-reported stress level of {value}/10 {effect_str}."
        elif feature == "Travel_Time_Minutes":
            return f"Commute duration of {value} minutes {effect_str}."
        elif feature == "Department":
            return f"Enrolled department '{value}' historical trend {effect_str}."
        elif feature == "Parental_Education":
            return f"Parental education level '{value}' {effect_str}."
        else:
            return f"{feature.replace('_', ' ')} value '{value}' {effect_str}."

explainer_service = ExplanationService()
