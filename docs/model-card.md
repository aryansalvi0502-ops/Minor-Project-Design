# Model Card: Student Dropout Risk Prediction Pipeline

## Model Details
- **Model Name:** Student Success Early-Warning Dropout Predictor
- **Active Model Version:** `v3.20261020.logistic_regression`
- **Architecture:** Balanced Logistic Regression Pipeline with Sigmoid Platt Calibration
- **Feature Preprocessing:** Median imputation & standard scaling for numericals; constant imputation & one-hot encoding for categoricals.
- **Decision Threshold:** `0.29` (Calibrated on validation fold to optimize recall for support interventions while controlling false alarms).

## Intended Use & Target Users
- **Primary Purpose:** Early identification of undergraduate students at risk of academic discontinuation to offer prioritized human mentorship, tutoring, and wellness resources.
- **Intended Users:**
  - Undergraduate students (self-service transparency and recovery planning).
  - Departmental faculty advisors (cohort triage and follow-up tracking).
  - Academic affairs management (aggregate, de-identified retention analytics).
- **Out-of-Scope / Prohibited Uses:**
  - Mandatory withdrawal or expulsion decisions.
  - Financial aid denial or scholarship revocation.
  - Automated punitive grading or academic standing penalties.

## Training & Evaluation Data
- **Dataset:** `data/student_dropout_dataset_v3.csv`
- **Total Records:** 10,000 instances
- **Target Distribution:**
  - `0` (Retained / Graduate): 7,646 (76.5%)
  - `1` (Dropout / Discontinuation): 2,354 (23.5%)
- **Data Splits:**
  - Train Split (70%): 7,000 instances
  - Validation Split (15%): 1,500 instances
  - Held-out Test Split (15%): 1,500 instances (Strictly held-out during all feature tuning)

## Empirical Evaluation Results (Held-Out Test Set)

| Metric | Score | Note |
|---|---|---|
| **ROC-AUC** | **0.8154** | Excellent ranking discrimination |
| **PR-AUC** | **0.5759** | Substantially outperforms random baseline (0.235) |
| **Recall (Dropout)** | **66.57%** | Successfully captures two-thirds of at-risk students |
| **Precision** | **51.20%** | Over 1 in 2 flagged students genuinely require support |
| **F1-Score** | **0.5788** | Balanced harmonic score |
| **Overall Accuracy** | **77.20%** | Measured test accuracy |

### Test Set Confusion Matrix (N = 1,500)
| | Predicted Retained (0) | Predicted At-Risk (1) |
|---|---|---|
| **Actual Retained (0)** | 923 (True Negative) | 224 (False Positive) |
| **Actual Dropout (1)** | 118 (False Negative) | 235 (True Positive) |

## Explainability & SHAP Contributions
- Primary risk-escalating factors:
  - Low Cumulative GPA & Semester GPA
  - High Assignment Delay Days
  - Low Lecture Attendance Rate
  - Elevated Stress Index
- Primary protective factors:
  - High Attendance (>=85%)
  - Consistent Study Hours (>=4.0 hrs/day)
  - Home Internet Access

## Limitations & Ethical Guidelines
1. **Correlations vs. Causes:** The model identifies statistical correlations from historical cohorts. An elevated score is not a verdict of failure.
2. **Missing Data Imputation:** Imputation uses training medians; students are encouraged to self-verify missing academic fields in their profile.
3. **Human Review Override:** Advisor judgment and student feedback unconditionally override automated classifications.
