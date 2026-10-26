# Student Success Early-Warning System
### Explainable AI for Student Dropout Prediction & Personalized Academic Recovery

A complete, production-grade academic early-warning system engineered from scratch in Antigravity. Features calibrated machine-learning risk predictions, SHAP feature explainability, 4-tier role-based access control, automated recovery roadmaps, customizable timetables, and complete light/dark mode design.

---

## Key Capabilities

1. **Empirical Machine Learning Pipeline:**
   - Evaluates **Logistic Regression (Class-Weighted)**, **Random Forest (Balanced Subsample)**, and **XGBoost**.
   - 70/15/15 stratified train/val/test split.
   - Sigmoid Platt probability calibration (`CalibratedClassifierCV`).
   - Decision threshold tuning optimizing for at-risk recall while controlling false alarms.
   - Evaluated on 10,000 real Kaggle records with zero synthetic data substitution.
   - Held-out test ROC-AUC: **0.8154**, Recall: **66.57%**, Accuracy: **77.20%**.

2. **Explainable AI with SHAP:**
   - Explains individual predictions showing exactly which factors increase or reduce risk.
   - Plain-language narrative explanations and horizontal contribution charts.
   - Transparent disclaimer: *Associations, not deterministic causation.*

3. **Role-Based Access Control (RBAC):**
   - **Student:** View/edit own profile, inspect own risk score and SHAP drivers, toggle recovery milestones, customize study timetable, request advisor meetings.
   - **Faculty Advisor:** Inspect assigned student cohort, filter by risk level and department, review individual student SHAP factors, log interventions, and maintain staff-only confidential notes.
   - **Management / Reviewer:** Aggregate de-identified analytics, department comparisons, semester trends, intervention outcome metrics, and CSV export.
   - **Administrator:** User management, role modification, system health monitoring, live audit logs, model retraining execution, and risk threshold tuning.

4. **Academic Calm Design System (Light & Dark Mode):**
   - Built with Vanilla CSS design tokens.
   - Light mode: Warm off-white surfaces (`#F8F9FA`, `#FFFFFF`), muted academic green (`#2D6A4F`).
   - Dark mode: Dark charcoal backgrounds (`#0F1215`, `#161B1E`), accessible contrast (`#F1F5F9`).
   - Light, Dark, and System preference options with zero-flash pre-hydration.
   - Multi-modal risk badges (Color + Icon + Text, never color alone).

---

## Quickstart (Windows PowerShell)

### 1. Backend (Terminal 1)
```powershell
# Install dependencies
pip install -r requirements.txt

# Run migrations
python -m alembic upgrade head

# Train model & serialize artifacts
python ml/training/train.py

# Run test suite
python -m pytest

# Start FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
Open **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)** in your browser.

---

## Quick Demo Credentials (1-Click Login on UI)
- **Student:** `student@university.edu` / `StudentPass123!`
- **Faculty Advisor:** `advisor@university.edu` / `AdvisorPass123!`
- **Management:** `management@university.edu` / `ManagePass123!`
- **Administrator:** `admin@university.edu` / `AdminPass123!`

---

## Repository Structure
```
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Modular API endpoints (auth, profiles, predictions, etc.)
│   │   ├── core/            # Config, database, security (bcrypt & JWT)
│   │   ├── models/          # SQLAlchemy relational models
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Business logic (risk, recovery, audit)
│   │   └── main.py          # FastAPI application & startup lifespan
│   ├── migrations/          # Alembic migrations
│   └── tests/               # Pytest suite (16 tests, 100% pass)
├── data/
│   ├── student_dropout_dataset_v3.csv  # Verified 10k dataset
│   └── README.md                       # Data dictionary & provenance
├── docs/
│   ├── architecture.md      # Mermaid diagrams, RBAC matrix, pipeline design
│   ├── model-card.md        # Official model card & evaluation metrics
│   └── setup.md             # Windows & cross-platform run guide
├── frontend/
│   ├── src/
│   │   ├── components/      # Badges, charts, modal, timetable, navbar
│   │   ├── context/         # Auth, Theme, and Notification contexts
│   │   ├── pages/           # Landing, Login, Dashboards for all 4 roles
│   │   ├── services/        # API client
│   │   └── styles/          # Academic calm CSS design system
│   ├── index.html
│   └── package.json
├── ml/
│   ├── training/train.py    # Training & benchmarking pipeline
│   ├── prediction/          # Live cached predictor & SHAP explainer
│   └── artifacts/           # Serialized joblib models & metadata
├── pytest.ini
├── requirements.txt
└── README.md
```
