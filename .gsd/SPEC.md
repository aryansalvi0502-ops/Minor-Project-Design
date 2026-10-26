# SPEC.md — Student Success Early-Warning System Enhancement

**Status: FINALIZED**
**Version:** 2.0.0
**Date:** 2026-10-24
**Scope:** Incremental feature expansion of the existing Student Success Early-Warning System.

---

## 1. Objectives & Principles

1. **Academic Improvement & Wellbeing First:** Prioritize student agency, actionable recovery, transparent explainability, and privacy over punitive metrics or purely decorative UI.
2. **Preserve Existing Architecture:** Reuse the existing trained ML pipeline (calibrated classifiers, SHAP explainer), FastAPI backend, SQLite/SQLAlchemy database, JWT authentication, 4-tier RBAC, and CSS design system.
3. **Real Data & Deterministic Foundations:** Use verified student records, real subject assessment marks, and genuine ML evaluations.
4. **Empirical Proof & Test-Driven:** Run automated tests and verify endpoints/UI after each incremental stage.

---

## 2. Feature Specifications

### Feature 1: Personalized Student Dashboard with Three Prioritized Next Actions
- **Backend:** Computes three dynamic, ranked actions derived from SHAP risk factors, attendance deficit, upcoming deadlines, weak subject topics, and recovery tasks.
- **Attributes:** Rank (`#1`, `#2`, `#3`), Title, Category (`Academic`, `Attendance`, `Habits`, `Support`), Rationale (e.g., *"Attendance at 68.5% is top risk driver"*), Urgency, and Direct interactive CTA.
- **Frontend:** Prominent 3-card priority container on the Student Dashboard.

### Feature 2: Adaptive Study Timetable Respecting Class Hours, Deadlines, and Availability
- **Data Model:** `student_timetables` and `student_deadlines` tables.
- **Algorithm:** Schedules adaptive study blocks in available student slots around fixed class hours, prioritizing subjects with upcoming deadlines and detected learning gaps.
- **Frontend:** Dynamic weekly timetable viewer and editor allowing students to set availability preferences (preferred daily study hours, work shifts, free slots) and add deadlines.

### Feature 3: Learning-Gap Analysis Using Actual Subject-Level Marks and Assessments
- **Data Model:** `subject_assessments` table tracking course code, subject name, assessment type (Midterm, Quiz, Lab, Assignment), marks obtained, maximum marks, and subtopic score breakdown.
- **Analytics:** Computes mastery percentage, identifies weak topics (< 60%), and maps specific concept gaps to recovery recommendations.
- **Frontend:** Subject performance breakdown with gap indicators, class average comparisons, and concept remediation links.

### Feature 4: Risk-Score History and Trend Detection Using Comparable Prediction Snapshots
- **Analytics:** Compares successive prediction snapshots. Calculates score delta, velocity, trajectory (`Improving`, `Deteriorating`, `Stable`), and feature-shift attribution.
- **Frontend:** Interactive visual trend indicator and sparkline/timeline showing risk trajectory and narrative attribution of what drove the shift.

### Feature 5: Multi-Factor What-If Simulator with Ethical Disclaimers
- **Capabilities:** Interactive hypothetical adjustments across GPA, study hours, attendance rate, assignment turnaround delays, and stress index.
- **Engine:** Evaluated in real-time through the calibrated ML model.
- **Guardrails:** Mandatory non-deterministic disclaimer: *"Hypothetical model projection only. Demonstrates sensitivity; does not guarantee specific outcomes."*

### Feature 6: Recovery-Plan Progress Tracking and Positive Milestone Feedback
- **Capabilities:** 25%, 50%, 75%, and 100% milestone detection with celebratory feedback, gamified achievement badges (`Attendance Champion`, `Consistency Master`), and streak tracking.
- **Frontend:** Milestone celebration toasts, visual badge showcases, and celebratory progress bars.

### Feature 7: Configurable Reminders and Notification Preferences
- **Data Model:** `notification_preferences` (toggle assignment, study, advisor, risk alerts, email/in-app) and `student_reminders` (custom study and deadline reminders).
- **Frontend:** Notification settings drawer/modal and customizable reminder manager.

### Feature 8: Verified Learning-Resource Recommendations
- **Data Model:** `learning_resources` repository categorized by department, course, and concept difficulty with verified open educational links (MIT OCW, Khan Academy, Coursera, university centers).
- **Matching:** Matches student's department and detected learning gaps to curated resources.

### Feature 9: Student Feedback on Recommendations and Support Effectiveness
- **Data Model:** `support_feedback` table capturing rating (1-5 stars), effectiveness category, and qualitative comments for recovery tasks, learning resources, and advisor sessions.
- **Frontend:** Interactive rating widgets with instant submission and confirmation.

### Feature 10: Human Advisor Appointment Lifecycle, Status Tracking, and Follow-ups
- **Workflow:** Request -> Scheduled/Confirmed (with room/video link) -> Completed -> Follow-up Notes and Action Items.
- **Interfaces:** Student request and tracking modal; Advisor appointment management panel with one-click confirmation and follow-up logging.

### Feature 11: Privacy and Transparency Page Explaining Predictions, Data Use, and Limitations
- **Content:** Data provenance, inputs used vs excluded, model architecture, calibration, false positive/negative trade-offs, human-in-the-loop guarantee, and student rights (FERPA/GDPR).
- **Access:** Direct navigation from Navbar and Footer.

### Feature 12: Onboarding, Form Validation, Mobile Responsiveness, Accessibility, and Error States
- **Onboarding:** Multi-step guided setup for first-time students.
- **Validation:** Clear inline error messages and range hints.
- **Mobile & A11y:** Responsive grid, touch targets, ARIA labels, semantic markup, and light/dark mode contrast compliance.

---

## 3. Database Schema Extensions

1. `subject_assessments`: Subject marks, assessment types, topic breakdowns.
2. `student_timetables`: Student availability preferences, fixed class slots, and adaptive study blocks.
3. `student_deadlines`: Coursework and exam deadlines.
4. `notification_preferences`: Configurable alert channels and lead times.
5. `student_reminders`: Individual scheduled study/assignment reminders.
6. `learning_resources`: Verified academic resources and guides.
7. `support_feedback`: Student ratings and effectiveness feedback on recommendations.
8. Enriched `advisor_interventions`: Modality, room/meeting link, follow-up notes, and follow-up tasks.

---

## 4. Verification & Proof Protocol
- Database migration upgrades cleanly without data loss.
- Pytest suite executes and passes 100%.
- Real data seeded and verifiable via API curl/JSON responses.
- Frontend builds cleanly without syntax errors and renders responsively in both light and dark modes.
