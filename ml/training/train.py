import os
import sys
import json
import time

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from datetime import datetime, timezone
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report
)
import xgboost as xgb
import shap

RANDOM_SEED = 42

NUMERICAL_FEATURES = [
    "Age",
    "Family_Income",
    "Study_Hours_per_Day",
    "Attendance_Rate",
    "Assignment_Delay_Days",
    "Travel_Time_Minutes",
    "Stress_Index",
    "GPA",
    "Semester_GPA",
    "CGPA"
]

CATEGORICAL_FEATURES = [
    "Gender",
    "Internet_Access",
    "Part_Time_Job",
    "Scholarship",
    "Semester",
    "Department",
    "Parental_Education"
]

TARGET_COL = "Dropout"
IDENTIFIER_COLS = ["Student_ID"]

def build_preprocessor():
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="Missing")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor

def evaluate_predictions(y_true, y_pred, y_prob):
    cm = confusion_matrix(y_true, y_pred).tolist()
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    metrics = {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, y_prob)), 4),
        "pr_auc": round(float(average_precision_score(y_true, y_prob)), 4),
        "confusion_matrix": cm,
        "true_negatives": int(tn),
        "false_positives": int(fp),
        "false_negatives": int(fn),
        "true_positives": int(tp),
        "false_positive_rate": round(float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0, 4),
        "false_negative_rate": round(float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0, 4)
    }
    return metrics

def run_training_pipeline(
    dataset_path="data/student_dropout_dataset_v3.csv",
    artifacts_dir="ml/artifacts",
    preferred_algo=None
):
    print("=" * 60)
    print("STARTING ML TRAINING & MODEL SELECTION PIPELINE")
    print(f"Dataset: {dataset_path} | Time: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    os.makedirs(artifacts_dir, exist_ok=True)

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Required dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    # Exclude identifier and separate features and target
    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES].copy()
    y = df[TARGET_COL].astype(int).values

    print(f"Target distribution: Retained (0) = {(y == 0).sum()} ({(y == 0).mean()*100:.1f}%), Dropout (1) = {(y == 1).sum()} ({(y == 1).mean()*100:.1f}%)")

    # Stratified Train (70%) / Validation (15%) / Test (15%)
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.15, stratify=y, random_state=RANDOM_SEED
    )

    val_ratio_of_train_val = 0.15 / 0.85
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=val_ratio_of_train_val, stratify=y_train_val, random_state=RANDOM_SEED
    )

    print(f"Data Splits: Train = {len(X_train)} rows | Validation = {len(X_val)} rows | Test = {len(X_test)} rows")

    # Define Candidate Models with class weighting to address imbalance
    candidate_models = {
        "random_forest": {
            "name": "Random Forest Classifier (Balanced Subsample)",
            "estimator": RandomForestClassifier(
                n_estimators=300,
                max_depth=12,
                min_samples_split=6,
                min_samples_leaf=3,
                class_weight="balanced_subsample",
                random_state=RANDOM_SEED,
                n_jobs=-1
            )
        },
        "logistic_regression": {
            "name": "Logistic Regression Baseline (Class-Weighted)",
            "estimator": LogisticRegression(
                class_weight="balanced",
                max_iter=1000,
                C=0.8,
                random_state=RANDOM_SEED
            )
        },
        "xgboost": {
            "name": "XGBoost Classifier (Scale Pos Weight)",
            "estimator": xgb.XGBClassifier(
                n_estimators=180,
                max_depth=4,
                learning_rate=0.06,
                subsample=0.85,
                colsample_bytree=0.85,
                scale_pos_weight=(len(y_train) - y_train.sum()) / y_train.sum(),
                random_state=RANDOM_SEED,
                eval_metric="logloss"
            )
        }
    }

    model_results = {}
    best_algo = None
    best_val_score = -1.0

    for algo_key, model_info in candidate_models.items():
        print(f"\n--- Training Candidate Model: {model_info['name']} ---")
        start_time = time.time()

        preprocessor = build_preprocessor()
        base_pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", model_info["estimator"])
        ])

        # Fit strictly on X_train only
        base_pipeline.fit(X_train, y_train)
        train_duration = round(time.time() - start_time, 2)

        # Train metrics
        y_train_pred = base_pipeline.predict(X_train)
        y_train_prob = base_pipeline.predict_proba(X_train)[:, 1]
        train_metrics = evaluate_predictions(y_train, y_train_pred, y_train_prob)

        # Validation metrics
        y_val_prob = base_pipeline.predict_proba(X_val)[:, 1]
        y_val_pred = (y_val_prob >= 0.5).astype(int)
        val_metrics = evaluate_predictions(y_val, y_val_pred, y_val_prob)

        print(f"Validation F1: {val_metrics['f1']} | Recall: {val_metrics['recall']} | Precision: {val_metrics['precision']} | ROC-AUC: {val_metrics['roc_auc']} | PR-AUC: {val_metrics['pr_auc']}")

        model_results[algo_key] = {
            "name": model_info["name"],
            "base_pipeline": base_pipeline,
            "train_duration_sec": train_duration,
            "train_metrics": train_metrics,
            "val_metrics": val_metrics
        }

        # Selection criterion: Balance Support identification (Recall) with Precision, prioritizing F1
        val_score = val_metrics["f1"] + 0.1 * val_metrics["roc_auc"]
        if val_score > best_val_score:
            best_val_score = val_score
            best_algo = algo_key

    if preferred_algo and preferred_algo in model_results:
        selected_algo = preferred_algo
        print(f"\nUsing requested algorithm: {selected_algo}")
    else:
        selected_algo = best_algo
        print(f"\nAlgorithm Selected via Validation Benchmark: {selected_algo} ({model_results[selected_algo]['name']})")

    selected_base_pipeline = model_results[selected_algo]["base_pipeline"]

    # Calibrate Probabilities using 3-fold cross-validation Platt scaling on training set
    print("\nCalibrating Model Probability Outputs with CalibratedClassifierCV (cv=3, sigmoid)...")
    preprocessor = selected_base_pipeline.named_steps["preprocessor"]
    base_estimator = selected_base_pipeline.named_steps["classifier"]

    calibrated_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", CalibratedClassifierCV(
            estimator=base_estimator,
            method="sigmoid",
            cv=3
        ))
    ])
    calibrated_pipeline.fit(X_train, y_train)

    # Threshold Tuning on Validation set to prioritize identifying students in need of support
    val_probs = calibrated_pipeline.predict_proba(X_val)[:, 1]
    threshold_candidates = np.linspace(0.25, 0.60, 36)
    best_threshold = 0.50
    best_threshold_f1 = -1.0

    for thresh in threshold_candidates:
        preds = (val_probs >= thresh).astype(int)
        f1 = f1_score(y_val, preds, zero_division=0)
        rec = recall_score(y_val, preds, zero_division=0)
        # Target high recall (finding at-risk students) while keeping precision balanced
        if rec >= 0.65 and f1 > best_threshold_f1:
            best_threshold_f1 = f1
            best_threshold = round(float(thresh), 2)

    print(f"Optimal Decision Threshold Selected: {best_threshold} (Validation F1 = {round(best_threshold_f1, 4)})")

    # Held-out Test Set Evaluation (Evaluating Final Model on completely unseen test data)
    print("\nEvaluating Final Selected & Calibrated Model on Held-out Test Set...")
    test_probs = calibrated_pipeline.predict_proba(X_test)[:, 1]
    test_preds_default = (test_probs >= 0.50).astype(int)
    test_preds_tuned = (test_probs >= best_threshold).astype(int)

    test_metrics_default = evaluate_predictions(y_test, test_preds_default, test_probs)
    test_metrics_tuned = evaluate_predictions(y_test, test_preds_tuned, test_probs)

    print("Test Set Metrics (Tuned Threshold):")
    print(json.dumps(test_metrics_tuned, indent=2))

    # Pre-compute SHAP Background references and transformed feature names
    print("\nInitializing SHAP Explainer References...")
    X_train_sample = X_train.sample(min(200, len(X_train)), random_state=RANDOM_SEED)
    X_train_trans = calibrated_pipeline.named_steps["preprocessor"].transform(X_train_sample)
    
    cat_encoder = calibrated_pipeline.named_steps["preprocessor"].named_transformers_["cat"].named_steps["encoder"]
    encoded_cat_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    feature_names = NUMERICAL_FEATURES + encoded_cat_names

    # Save artifacts
    pipeline_path = os.path.join(artifacts_dir, "student_dropout_pipeline.joblib")
    joblib.dump(calibrated_pipeline, pipeline_path)
    print(f"Saved complete calibrated pipeline to {pipeline_path}")

    base_model_path = os.path.join(artifacts_dir, "base_model_pipeline.joblib")
    joblib.dump(selected_base_pipeline, base_model_path)
    print(f"Saved base model pipeline for fast SHAP to {base_model_path}")

    shap_bg_path = os.path.join(artifacts_dir, "shap_background.joblib")
    joblib.dump({
        "background_sample": X_train_sample,
        "background_trans": X_train_trans,
        "feature_names": feature_names,
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "algorithm": selected_algo
    }, shap_bg_path)
    print(f"Saved SHAP background references to {shap_bg_path}")

    # Build model version metadata
    model_version = f"v3.{datetime.now(timezone.utc).strftime('%Y%m%d')}.{selected_algo}"
    metadata = {
        "version_tag": model_version,
        "algorithm_name": model_results[selected_algo]["name"],
        "selected_algorithm": selected_algo,
        "is_active": True,
        "training_date": datetime.now(timezone.utc).isoformat(),
        "dataset_version": "student_dropout_dataset_v3.csv",
        "dataset_rows": len(df),
        "random_seed": RANDOM_SEED,
        "features_used": NUMERICAL_FEATURES + CATEGORICAL_FEATURES,
        "excluded_features": IDENTIFIER_COLS,
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "transformed_feature_count": len(feature_names),
        "selected_threshold": best_threshold,
        "calibration_method": "sigmoid_platt_scaling_cv3",
        "candidate_comparison": {
            k: {
                "name": v["name"],
                "train_duration_sec": v["train_duration_sec"],
                "val_f1": v["val_metrics"]["f1"],
                "val_recall": v["val_metrics"]["recall"],
                "val_precision": v["val_metrics"]["precision"],
                "val_roc_auc": v["val_metrics"]["roc_auc"],
                "val_pr_auc": v["val_metrics"]["pr_auc"]
            }
            for k, v in model_results.items()
        },
        "metrics_train": model_results[selected_algo]["train_metrics"],
        "metrics_val": model_results[selected_algo]["val_metrics"],
        "metrics_test": test_metrics_tuned,
        "metrics_test_at_default_50": test_metrics_default,
        "limitations_notes": (
            "1. Predictions are probabilistic risk estimates based on observational academic associations. "
            "They must never be used punitively or fatalistically. "
            "2. Identifiers (Student_ID) are strictly excluded from prediction features. "
            "3. Model performance depends on the completeness of academic reports; missing values are imputed via training medians. "
            "4. Human advisor intervention and student data verification must always supersede automated scores."
        )
    }

    meta_path = os.path.join(artifacts_dir, "metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to {meta_path}")

    # Synchronize metadata with the Database ModelVersionMetadata table
    try:
        from backend.app.core.database import SessionLocal
        from backend.app.models.model_version import ModelVersionMetadata
        db = SessionLocal()
        # Set existing versions to inactive
        db.query(ModelVersionMetadata).update({ModelVersionMetadata.is_active: False})
        
        db_record = ModelVersionMetadata(
            version_tag=metadata["version_tag"],
            algorithm_name=metadata["algorithm_name"],
            is_active=True,
            training_date=datetime.now(timezone.utc),
            dataset_version=metadata["dataset_version"],
            dataset_rows=metadata["dataset_rows"],
            features_used=metadata["features_used"],
            metrics_train=metadata["metrics_train"],
            metrics_val=metadata["metrics_val"],
            metrics_test=metadata["metrics_test"],
            selected_threshold=metadata["selected_threshold"],
            calibration_method=metadata["calibration_method"],
            limitations_notes=metadata["limitations_notes"]
        )
        db.add(db_record)
        db.commit()
        db.close()
        print("Successfully synchronized model version into database table 'model_versions'.")
    except Exception as db_err:
        print(f"Notice: Database sync deferred ({db_err})")

    print("=" * 60)
    print(f"MODEL TRAINING COMPLETED SUCCESSFULLY: {model_version}")
    print(f"Test Accuracy: {test_metrics_tuned['accuracy']} | Test F1: {test_metrics_tuned['f1']} | Test Recall: {test_metrics_tuned['recall']} | Test ROC-AUC: {test_metrics_tuned['roc_auc']}")
    print("=" * 60)
    return metadata

if __name__ == "__main__":
    run_training_pipeline()
