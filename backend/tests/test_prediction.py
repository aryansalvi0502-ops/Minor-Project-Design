import pytest
from ml.prediction.predictor import prediction_service
from ml.prediction.explainer import explainer_service
from backend.app.services.risk_service import risk_service

def test_risk_classification_boundaries():
    svc = risk_service
    # Low risk (<30)
    assert svc.classify_risk(0.0) == "Low"
    assert svc.classify_risk(29.9) == "Low"
    
    # Medium risk (30 - 59.9)
    assert svc.classify_risk(30.0) == "Medium"
    assert svc.classify_risk(59.9) == "Medium"
    
    # High risk (>=60)
    assert svc.classify_risk(60.0) == "High"
    assert svc.classify_risk(100.0) == "High"

def test_probability_to_score_conversion():
    svc = risk_service
    assert svc.calculate_score(0.0) == 0.0
    assert svc.calculate_score(0.2543) == 25.4
    assert svc.calculate_score(0.7891) == 78.9
    assert svc.calculate_score(1.0) == 100.0
    # Boundary clamps
    assert svc.calculate_score(-0.1) == 0.0
    assert svc.calculate_score(1.5) == 100.0

def test_model_inference_and_explanation():
    assert prediction_service.is_ready, "Model should be loaded and ready"
    
    test_student = {
        "Age": 21.0,
        "Gender": "Male",
        "Family_Income": 30000.0,
        "Internet_Access": "Yes",
        "Study_Hours_per_Day": 1.0,
        "Attendance_Rate": 55.0,
        "Assignment_Delay_Days": 5,
        "Travel_Time_Minutes": 45.0,
        "Part_Time_Job": "Yes",
        "Scholarship": "No",
        "Stress_Index": 8.0,
        "GPA": 1.2,
        "Semester_GPA": 1.1,
        "CGPA": 1.15,
        "Semester": "Year 2",
        "Department": "CS",
        "Parental_Education": "High School"
    }

    pred = prediction_service.predict_student_risk(test_student)
    assert 0.0 <= pred["dropout_probability"] <= 1.0
    assert 0.0 <= pred["risk_score"] <= 100.0
    assert pred["risk_category"] in ["Low", "Medium", "High"]
    assert "model_version" in pred

    # Test SHAP explanation
    assert explainer_service.is_ready, "Explainer should be loaded and ready"
    explanation = explainer_service.explain_student(test_student)
    assert "summary_text" in explanation
    assert len(explanation["feature_contributions"]) > 0
    
    first_contrib = explanation["feature_contributions"][0]
    assert "feature" in first_contrib
    assert "effect" in first_contrib
    assert first_contrib["effect"] in ["increases_risk", "decreases_risk", "neutral"]
    assert "shap_value" in first_contrib
    assert "description" in first_contrib
