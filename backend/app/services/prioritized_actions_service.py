from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.profile import StudentProfile
from backend.app.models.prediction import PredictionRecord
from backend.app.models.recovery import RecoveryPlan, RecoveryTask
from backend.app.models.academic_marks import SubjectAssessment
from backend.app.models.timetable import StudentDeadline
from backend.app.schemas.recovery import PrioritizedActionItem, PrioritizedActionsOut

class PrioritizedActionsService:
    """
    Computes three prioritized, actionable next steps for a student based on:
    - Actual subject marks & diagnosed concept gaps
    - Model risk factor drivers (attendance, study hours, delay)
    - Upcoming coursework deadlines
    - Recovery plan milestone progress
    """

    def compute_top_three_actions(self, profile: StudentProfile, db: Session) -> PrioritizedActionsOut:
        # 1. Fetch auxiliary records
        assessments = db.query(SubjectAssessment).filter(
            SubjectAssessment.student_id == profile.id
        ).order_by(SubjectAssessment.assessed_date.desc()).all()

        pred = db.query(PredictionRecord).filter(
            PredictionRecord.student_id == profile.id,
            PredictionRecord.is_active == True
        ).first()

        plan = db.query(RecoveryPlan).filter(
            RecoveryPlan.student_id == profile.id,
            RecoveryPlan.status == "active"
        ).first()

        deadlines = db.query(StudentDeadline).filter(
            StudentDeadline.student_id == profile.id,
            StudentDeadline.is_completed == False
        ).order_by(StudentDeadline.due_date.asc()).all()

        actions: List[PrioritizedActionItem] = []

        # --- RANK 1: TOP PRIORITY (Critical Academic Deficit or Core Risk Factor) ---
        # Check for critical concept gap in assessments
        critical_gap = None
        for a in assessments:
            if a.topic_breakdown and isinstance(a.topic_breakdown, list):
                for tb in a.topic_breakdown:
                    score = float(tb.get("score", 100))
                    max_s = float(tb.get("max", 100))
                    pct = (score / max_s * 100.0) if max_s > 0 else 100.0
                    if pct < 55.0:
                        critical_gap = (tb.get("topic"), a.subject_code, a.subject_name, round(pct, 1))
                        break
            if critical_gap:
                break

        if critical_gap:
            topic, code, name, pct = critical_gap
            actions.append(PrioritizedActionItem(
                id="act_concept_gap",
                rank=1,
                badge="Top Priority",
                title=f"Targeted Concept Mastery: {topic} ({code})",
                category="academic",
                rationale=f"Recent assessment revealed a score of {pct}% in '{topic}'. Dedicated concept practice prevents cumulative exam failure.",
                urgency="Immediate",
                action_type="navigate",
                action_target="resources",
                cta_text="Access Verified Study Guides",
                is_completed=False
            ))
        elif profile.attendance_rate < 75.0:
            actions.append(PrioritizedActionItem(
                id="act_attendance_deficit",
                rank=1,
                badge="Top Priority",
                title=f"Attendance Recovery Protocol ({profile.attendance_rate:.1f}%)",
                category="attendance",
                rationale=f"Your attendance is below the 75% institutional threshold, driving elevated model risk. Pre-commit to 100% lecture attendance this week.",
                urgency="Immediate",
                action_type="navigate",
                action_target="timetable",
                cta_text="Review Class Lecture Schedule",
                is_completed=False
            ))
        elif profile.cgpa < 5.0:
            actions.append(PrioritizedActionItem(
                id="act_gpa_support",
                rank=1,
                badge="Top Priority",
                title=f"Core Coursework Tutoring Consultation",
                category="academic",
                rationale=f"Cumulative GPA is {profile.cgpa:.2f}/10. Connect with faculty advisor to enroll in subsidized peer-tutoring.",
                urgency="Immediate",
                action_type="open_modal",
                action_target="support",
                cta_text="Request Advisor Consultation",
                is_completed=False
            ))
        else:
            actions.append(PrioritizedActionItem(
                id="act_academic_consistency",
                rank=1,
                badge="Top Priority",
                title="Sustain Core Concept Mastery & Problem Sets",
                category="academic",
                rationale="Good academic standing. Solidify foundational understanding by completing 5 end-of-chapter problems weekly.",
                urgency="This Week",
                action_type="navigate",
                action_target="resources",
                cta_text="Explore Course Materials",
                is_completed=False
            ))

        # --- RANK 2: HIGH PRIORITY (Coursework Deadlines, Study Routine or Recovery Milestones) ---
        if deadlines:
            next_dl = deadlines[0]
            due_str = next_dl.due_date.strftime("%a, %b %d")
            actions.append(PrioritizedActionItem(
                id=f"act_deadline_{next_dl.id}",
                rank=2,
                badge="High Priority",
                title=f"Coursework Milestone: {next_dl.title}",
                category="assignment",
                rationale=f"Due on {due_str} (~{next_dl.estimated_hours_needed:.1f}h needed). Schedule study blocks today to avoid last-minute rush.",
                urgency="This Week",
                action_type="navigate",
                action_target="timetable",
                cta_text="Open Adaptive Timetable",
                is_completed=next_dl.is_completed
            ))
        elif plan and plan.tasks:
            uncompleted = [t for t in plan.tasks if not t.is_completed]
            if uncompleted:
                task = uncompleted[0]
                actions.append(PrioritizedActionItem(
                    id=f"act_task_{task.id}",
                    rank=2,
                    badge="High Priority",
                    title=f"Recovery Milestone: {task.title}",
                    category=task.category or "academic",
                    rationale=task.description or "Active task from your personalized recovery roadmap.",
                    urgency="This Week",
                    action_type="navigate",
                    action_target="recovery",
                    cta_text="View Recovery Roadmap",
                    is_completed=False
                ))
            else:
                actions.append(PrioritizedActionItem(
                    id="act_all_tasks_done",
                    rank=2,
                    badge="High Priority",
                    title="100% Recovery Roadmap Achieved!",
                    category="habits",
                    rationale="All milestone tasks completed. Re-evaluate your profile to capture risk score improvements.",
                    urgency="Ongoing",
                    action_type="navigate",
                    action_target="recovery",
                    cta_text="Review Milestones",
                    is_completed=True
                ))
        else:
            study_hrs = profile.study_hours_per_day if profile.study_hours_per_day is not None else 2.5
            actions.append(PrioritizedActionItem(
                id="act_study_routine",
                rank=2,
                badge="High Priority",
                title=f"Structured 2x45-Min Daily Study Blocks ({study_hrs:.1f}h/day)",
                category="habits",
                rationale="Implement daily phone-free focus sessions for your highest-credit course.",
                urgency="This Week",
                action_type="navigate",
                action_target="timetable",
                cta_text="Configure Study Hours",
                is_completed=False
            ))

        # --- RANK 3: MEDIUM PRIORITY (Advisor Check-in, Wellbeing & Resource Feedback) ---
        stress = profile.stress_index if profile.stress_index is not None else 5.0
        if stress >= 6.5 or profile.part_time_job == "Yes":
            actions.append(PrioritizedActionItem(
                id="act_wellness_checkin",
                rank=3,
                badge="Medium Priority",
                title="Advisor Workload & Wellbeing Check-in",
                category="advisor",
                rationale=f"Self-reported stress is {stress:.1f}/10{' with part-time employment' if profile.part_time_job == 'Yes' else ''}. Discuss academic accommodations with your advisor.",
                urgency="This Week",
                action_type="open_modal",
                action_target="support",
                cta_text="Schedule Advisor Meeting",
                is_completed=False
            ))
        else:
            actions.append(PrioritizedActionItem(
                id="act_explore_resources",
                rank=3,
                badge="Medium Priority",
                title="Explore Verified Learning Resources & Guides",
                category="resources",
                rationale=f"Review verified open-course materials and problem banks curated for {profile.department} students.",
                urgency="Ongoing",
                action_type="navigate",
                action_target="resources",
                cta_text="Browse Resources",
                is_completed=False
            ))

        summary = f"Generated {len(actions)} high-impact next actions tailored to your current academic performance, learning gaps, and deadlines."

        return PrioritizedActionsOut(
            actions=actions[:3],
            last_evaluated=datetime.now(timezone.utc),
            summary=summary
        )

prioritized_actions_service = PrioritizedActionsService()
