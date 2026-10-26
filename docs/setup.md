# Setup & Run Guide (Windows / Cross-Platform)

## Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js 18+** and **npm**
- **Git** (optional)

---

## 1. Backend Setup

### Step 1.1: Clone & Navigate to Workspace Root
```powershell
cd "c:\Users\ARYAN\OneDrive\Desktop\Minor project design"
```

### Step 1.2: Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### Step 1.3: Configure Environment Variables
Copy `.env.example` to `.env` (already done by default):
```powershell
Copy-Item .env.example .env
```

### Step 1.4: Run Database Migrations
Applies Alembic migrations to create all database tables:
```powershell
python -m alembic upgrade head
```

### Step 1.5: Train the ML Model Suite
Trains candidate models on `data/student_dropout_dataset_v3.csv`, benchmarks performance, applies probability calibration, and saves SHAP artifacts:
```powershell
python ml/training/train.py
```

### Step 1.6: Execute the Automated Test Suite
Runs all 16 automated tests covering data integrity, RBAC isolation, ML inference, and recovery plans:
```powershell
python -m pytest
```

### Step 1.7: Start the FastAPI Server
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Alternative Redoc UI: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 2. Frontend Setup

### Step 2.1: Navigate to Frontend Directory
Open a separate terminal:
```powershell
cd "c:\Users\ARYAN\OneDrive\Desktop\Minor project design\frontend"
```

### Step 2.2: Install NPM Dependencies
```powershell
npm install
```

### Step 2.3: Start Vite Development Server
```powershell
npm run dev
```
Open your browser to: **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)**

---

## 3. Pre-Configured Test Accounts (1-Click Login)

The system automatically provisions demonstration accounts on first boot:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Student** | `student@university.edu` | `StudentPass123!` | Personal profile, risk score, SHAP drivers, active recovery plan, timetable |
| **Faculty Advisor** | `advisor@university.edu` | `AdvisorPass123!` | Assigned cohort students, student details, case review, intervention notes |
| **Management** | `management@university.edu` | `ManagePass123!` | Institutional aggregate analytics, department trends, de-identified CSV export |
| **Administrator** | `admin@university.edu` | `AdminPass123!` | Full governance, role switching, system health, live audit logs, model retraining |
