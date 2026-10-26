# ROADMAP.md — Student Success Early-Warning System Enhancement

## Overview
Decomposition of the 12 requested enhancements into four incremental, verifiable waves adhering to GSD canonical rules.

---

## Wave 1: Database Models, Alembic Migration & Seed Data
- [ ] Task 1.1: Define new SQLAlchemy models in `backend/app/models/` (`academic_marks.py`, `learning_resources.py`, `reminders.py`, `timetable.py`, `feedback.py`, and update `advisor.py`).
- [ ] Task 1.2: Create and apply Alembic migration (`add_phase2_enhancements`).
- [ ] Task 1.3: Update model exports in `backend/app/models/__init__.py` and seed realistic subject marks, verified resources, and default preferences in `main.py`.
- [ ] Task 1.4: Add unit tests in `backend/tests/test_enhancements_models.py` and run pytest.

## Wave 2: Academic Analytics, What-If Simulator & Trend Detection (Features 3, 4, 5)
- [ ] Task 2.1: Implement Learning-Gap Analysis service & API endpoints (`GET /profiles/my-learning-gaps`, `POST /profiles/subject-marks`).
- [ ] Task 2.2: Implement Prediction History & Trend Detection engine (`GET /predictions/trends`) with comparable snapshot delta and narrative attribution.
- [ ] Task 2.3: Implement Multi-Factor What-If Simulator (`POST /predictions/simulate-what-if`) with real model recalculation and non-guarantee ethical disclaimer.
- [ ] Task 2.4: Add tests for analytics, trends, and simulation in `backend/tests/test_analytics_and_simulation.py` and run pytest.

## Wave 3: Prioritized Actions, Adaptive Timetable, Reminders, Resources, Feedback & Advisor (Features 1, 2, 6, 7, 8, 9, 10)
- [ ] Task 3.1: Implement Top 3 Prioritized Next Actions service (`GET /recovery/prioritized-actions`).
- [ ] Task 3.2: Implement Adaptive Study Timetable engine respecting class hours, deadlines, and availability (`/recovery/timetable/*`).
- [ ] Task 3.3: Implement Recovery Milestone tracking with positive celebratory feedback & achievement badges (`/recovery/tasks/{id}/toggle`).
- [ ] Task 3.4: Implement Notification Preferences & Configurable Reminders API (`/notifications/preferences`, `/notifications/reminders`).
- [ ] Task 3.5: Implement Verified Learning Resources API (`GET /recovery/resources`) & Student Feedback API (`POST /support/feedback`).
- [ ] Task 3.6: Implement Human Advisor Appointment lifecycle, status tracking, and follow-ups (`/advisor/appointments/*`).
- [ ] Task 3.7: Add comprehensive tests in `backend/tests/test_recovery_and_support_v2.py` and run pytest.

## Wave 4: Frontend UI Integration, Privacy/Transparency & Polish (Features 11, 12 + UI Components)
- [ ] Task 4.1: Create Privacy & Transparency Page (`frontend/src/pages/PrivacyTransparencyPage.jsx`) explaining predictions, data use, and model limitations.
- [ ] Task 4.2: Build frontend components: `TopPrioritizedActions.jsx`, `LearningGapsCard.jsx`, `RiskTrendChart.jsx`, `WhatIfSimulator.jsx`, `AdaptiveTimetable.jsx`, `ResourceHub.jsx`, `FeedbackModal.jsx`, and `AdvisorAppointmentModal.jsx`.
- [ ] Task 4.3: Integrate all components into `StudentDashboard.jsx` and `AdvisorDashboard.jsx`.
- [ ] Task 4.4: Add onboarding wizard, form validations, accessibility improvements, mobile responsiveness, and verify light/dark mode.
- [ ] Task 4.5: Run full pytest suite and compile frontend to verify zero regressions.
