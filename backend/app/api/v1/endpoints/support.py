from datetime import datetime, timezone
import os
import re
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.prediction import PredictionRecord
from backend.app.models.recovery import RecoveryPlan
from backend.app.models.advisor import AdvisorIntervention
from backend.app.models.notification import InAppNotification
from backend.app.models.feedback import SupportFeedback
from backend.app.schemas.advisor import SupportFeedbackCreate, SupportFeedbackOut
from backend.app.services.audit_service import log_audit_event

router = APIRouter()

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: Optional[List[ChatMessage]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str
    suggested_prompts: List[str]
    escalate_to_human: bool = False
    escalation_reason: Optional[str] = None
    context_snapshot: Optional[Dict[str, Any]] = None

class HumanSupportRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=120)
    urgency: str = Field(default="Normal", description="'Normal', 'High', 'Urgent'")
    modality: str = Field(default="In-Person", description="'In-Person', 'Video Consultation', 'Async Review'")
    notes: str = Field(..., min_length=5, max_length=1500)
    preferred_date: Optional[datetime] = None

class AdvisorInfoOut(BaseModel):
    advisor_id: Optional[int]
    name: str
    email: str
    department: str
    office_hours: str
    available_modalities: List[str]

class HumanSupportTicketOut(BaseModel):
    id: int
    topic: str
    status: str
    urgency: str = "Normal"
    modality: str = "In-Person"
    meeting_date: Optional[datetime] = None
    meeting_link_or_location: Optional[str] = None
    student_notes: Optional[str] = None
    action_taken: Optional[str] = None
    follow_up_notes: Optional[str] = None
    follow_up_tasks: Optional[str] = None
    created_at: datetime
    advisor_name: str

def generate_ai_response(
    query: str,
    history: List[ChatMessage],
    profile: StudentProfile,
    pred: Optional[PredictionRecord],
    plan: Optional[RecoveryPlan],
    db: Optional[Session] = None
) -> Dict[str, Any]:
    """
    Intelligent context-aware academic assistant reasoning engine.
    Analyzes student query alongside their verified MITAOE curriculum enrollment,
    actual assessment records, upcoming deadlines, GPA threshold, and recovery plan.
    """
    q_lower = query.lower().strip()
    cgpa = profile.cgpa
    dept = profile.department
    year = profile.semester
    prog = profile.degree_program or "Computer Engineering"
    inst = profile.institution or "MITAOE"
    risk_cat = pred.risk_category if pred else "Low"
    risk_score = pred.risk_score if pred else 20.0
    att = profile.attendance_rate

    # Fetch authorized student records from database
    enrolled_courses = []
    assessments = []
    deadlines = []
    if db:
        from backend.app.models.curriculum import StudentCourseEnrollment
        from backend.app.models.academic_marks import SubjectAssessment
        from backend.app.models.timetable import StudentDeadline

        enrolled_courses = db.query(StudentCourseEnrollment).filter(
            StudentCourseEnrollment.student_id == profile.id,
            StudentCourseEnrollment.is_confirmed == True
        ).all()
        assessments = db.query(SubjectAssessment).filter(
            SubjectAssessment.student_id == profile.id
        ).all()
        deadlines = db.query(StudentDeadline).filter(
            StudentDeadline.student_id == profile.id,
            StudentDeadline.is_completed == False
        ).order_by(StudentDeadline.due_date.asc()).all()

    # Determine weak subjects with real assessment evidence or low confidence
    weak_subjects_data = []
    for a in assessments:
        pct = (a.obtained_score / a.max_score * 100.0) if a.max_score > 0 else 0.0
        if pct < 65.0:
            weak_subjects_data.append({
                "code": a.subject_code,
                "name": a.subject_name,
                "score": f"{a.obtained_score}/{a.max_score} ({pct:.1f}%)",
                "reason": "Recorded assessment deficit"
            })
    for e in enrolled_courses:
        if e.confidence_level == "Low" and not any(w["code"] == e.course_code for w in weak_subjects_data):
            weak_subjects_data.append({
                "code": e.course_code,
                "name": e.course_title,
                "score": "Self-reported Low Confidence",
                "reason": f"Difficult topics: {', '.join(e.difficult_topics) if e.difficult_topics else 'Core concepts'}"
            })

    # Check for urgent wellness/crisis triggers
    crisis_keywords = ["suicide", "kill myself", "end my life", "hopeless", "can't go on", "severe panic", "self harm", "depressed", "breakdown"]
    if any(k in q_lower for k in crisis_keywords):
        return {
            "reply": (
                "I hear that you are going through an extraordinarily overwhelming time. Your health, safety, and well-being "
                "matter far more than any grade or academic score. Please connect immediately with our campus care team:\n\n"
                "• **MITAOE Student Counseling Cell (Dr. Sneha Iyer):** Office #204, Student Care Center\n"
                "• **Tele-MANAS National Mental Health Helpline (India):** Dial **14416** or **1800-891-4416** (Toll-Free, 24/7)\n"
                "• **Faculty Advisor Confidential Office Hours:** I have flagged this so you can directly request an immediate check-in.\n\n"
                "You do not have to carry this alone. Please click the 'Request Human Advisor' button below to connect directly with your advisor."
            ),
            "suggested_prompts": [
                "Schedule priority check-in with my advisor",
                "Where is the MITAOE counseling cell located?",
                "Can I request a short-term academic extension?"
            ],
            "escalate_to_human": True,
            "escalation_reason": "Personal/Wellness Crisis Support Priority"
        }

    # Query: What should I study today?
    if any(k in q_lower for k in ["what should i study today", "what to study", "study today", "today's study"]):
        if weak_subjects_data:
            focus_sub = weak_subjects_data[0]
            reply_text = (
                f"### Recommended Study Focus for Today ({inst} - {prog})\n\n"
                f"Based on your recorded academic data, your top priority today is **{focus_sub['code']}: {focus_sub['name']}**.\n\n"
                f"**Why this subject today:**\n"
                f"• {focus_sub['reason']} ({focus_sub['score']}).\n\n"
                f"**Suggested 90-Minute Focus Session:**\n"
                f"1. **Review (30 mins):** Review lecture notes and core definitions.\n"
                f"2. **Practice (45 mins):** Solve 3-4 problem sets or past paper questions.\n"
                f"3. **Recap (15 mins):** Write down a one-page formula/concept summary.\n\n"
            )
        elif enrolled_courses:
            first_c = enrolled_courses[0]
            reply_text = (
                f"### Today's Suggested Study Plan ({inst} - {prog})\n\n"
                f"Your enrolled subjects are in good standing! For today's session, dedicate time to **{first_c.course_code}: {first_c.course_title}**.\n\n"
                f"• Target study time: **{profile.study_hours_per_day or 2.5} hours**.\n"
                f"• Goal: {first_c.academic_goal or 'Complete weekly module practice'}.\n\n"
            )
        else:
            reply_text = (
                f"### Today's Study Recommendation\n\n"
                f"You have not confirmed your enrolled subjects for this semester yet. "
                f"Please head to the **Course Enrollment** section to confirm your MITAOE courses so I can build a precise daily study schedule."
            )

        if deadlines:
            next_dl = deadlines[0]
            reply_text += f"\n> **Upcoming Deadline Alert:** {next_dl.title} ({next_dl.subject_code or 'General'}) due on **{next_dl.due_date.strftime('%d %b, %Y')}**."

        return {
            "reply": reply_text,
            "suggested_prompts": [
                "Which subjects need more attention?",
                "Create my weekly timetable",
                "What assignments are pending?"
            ],
            "escalate_to_human": False
        }

    # Query: Which subjects need more attention? / Weak subjects
    if any(k in q_lower for k in ["need more attention", "weak subject", "learning gap", "struggling", "difficult subject"]):
        if not enrolled_courses and not assessments:
            return {
                "reply": (
                    f"### Subject Performance Diagnostic ({inst})\n\n"
                    f"I don't have recorded assessment marks or confirmed courses for your profile yet. "
                    f"To identify your exact learning gaps:\n"
                    f"1. Confirm your MITAOE semester subjects in the Onboarding modal or Profile page.\n"
                    f"2. Log your recent internal assessment, quiz, or practical marks.\n\n"
                    f"Once added, I will diagnose specific concept gaps and recommend targeted practice materials."
                ),
                "suggested_prompts": [
                    "How do I log my assessment marks?",
                    "What should I study today?",
                    "Schedule a meeting with my advisor"
                ],
                "escalate_to_human": False
            }

        if weak_subjects_data:
            breakdown_lines = "\n".join([f"• **{w['code']}: {w['name']}** — {w['reason']} ({w['score']})" for w in weak_subjects_data])
            return {
                "reply": (
                    f"### Learning-Gap Analysis for {prog}\n\n"
                    f"The following enrolled courses require focused attention based on verified records:\n\n"
                    f"{breakdown_lines}\n\n"
                    f"**Actionable Next Steps:**\n"
                    f"1. Dedicate at least 4 hours/week of targeted self-study to these subjects.\n"
                    f"2. Review verified resources in the Learning Resources tab.\n"
                    f"3. Attend faculty consultation hours with Disha Malpure Ma'am to clarify challenging units."
                ),
                "suggested_prompts": [
                    "What should I study today?",
                    "Create a recovery plan for my weak subjects",
                    "Connect me with a faculty advisor"
                ],
                "escalate_to_human": len(weak_subjects_data) >= 2
            }
        else:
            return {
                "reply": (
                    f"### Subject Performance Status ({inst} - {prog})\n\n"
                    f"Great news! None of your current enrolled subjects show critical deficits. All recorded assessments are at or above satisfactory benchmarks (>= 65%).\n\n"
                    f"To maintain this trajectory and aim for distinction (>= 8.0 CGPA), continue regular revision of your core engineering coursework."
                ),
                "suggested_prompts": [
                    "What should I study today?",
                    "Create my weekly timetable",
                    "What assignments are pending?"
                ],
                "escalate_to_human": False
            }

    # Query: What assignments/deadlines are pending?
    if any(k in q_lower for k in ["pending assignment", "assignments", "deadline", "due date", "homework", "submission"]):
        if deadlines:
            dl_lines = "\n".join([f"• **{d.title}** ({d.subject_code or 'Coursework'}) — Due: **{d.due_date.strftime('%a, %d %b %Y')}** ({d.estimated_hours_needed}h estimated)" for d in deadlines])
            return {
                "reply": (
                    f"### Active Coursework Deadlines ({inst})\n\n"
                    f"You have **{len(deadlines)}** pending coursework deadlines:\n\n"
                    f"{dl_lines}\n\n"
                    f"**Pro Tip:** Submitting assignments 24 hours before the deadline helps prevent last-minute server congestion and protects your attendance/submission rating."
                ),
                "suggested_prompts": [
                    "What should I study today?",
                    "Add these study blocks to my recovery timetable",
                    "Which subjects need more attention?"
                ],
                "escalate_to_human": False
            }
        else:
            return {
                "reply": (
                    f"### Coursework Deadlines\n\n"
                    f"You currently have no pending coursework deadlines recorded in your timetable.\n\n"
                    f"You can add upcoming assignments, lab submissions, or exam dates in the **Adaptive Timetable** tab to have them automatically scheduled into your weekly routine."
                ),
                "suggested_prompts": [
                    "What should I study today?",
                    "Create my weekly timetable",
                    "Explain my risk score"
                ],
                "escalate_to_human": False
            }

    # Query: Create / adapt weekly timetable
    if any(k in q_lower for k in ["timetable", "schedule", "weekly timetable", "routine"]):
        course_names = [f"{c.course_code} ({c.course_title})" for c in enrolled_courses[:4]] if enrolled_courses else [f"Core {dept} Modules"]
        return {
            "reply": (
                f"### Adaptive MITAOE Study Timetable ({prog} - {year})\n\n"
                f"Generated based on your **{profile.study_hours_per_day or 3.0} hours/day** study preference, "
                f"commuting transit ({profile.travel_time_minutes} mins), and enrolled subjects:\n\n"
                f"• **Monday & Wednesday (Problem Solving & Core Theory):**\n"
                f"  - 5:30 PM – 7:00 PM: {course_names[0] if course_names else 'Core Coursework'}\n"
                f"  - 7:15 PM – 8:30 PM: Problem set practice & concept mapping\n\n"
                f"• **Tuesday & Thursday (Applied Lab & System Design):**\n"
                f"  - 5:30 PM – 7:00 PM: {course_names[1] if len(course_names) > 1 else 'Applied Laboratory Prep'}\n"
                f"  - 7:15 PM – 8:30 PM: Assignment drafts & coding practice\n\n"
                f"• **Friday & Saturday (Revision & Weak Concept Recovery):**\n"
                f"  - 4:00 PM – 6:00 PM: {weak_subjects_data[0]['code'] if weak_subjects_data else (course_names[2] if len(course_names) > 2 else 'Weekly Synthesis')}\n"
                f"  - 6:30 PM – 7:30 PM: Self-assessment quizzes & milestone review\n\n"
                f"Would you like to sync this schedule directly into your interactive timetable? Visit the **Adaptive Timetable** tab to fine-tune your slots."
            ),
            "suggested_prompts": [
                "What should I study today?",
                "Which subjects need more attention?",
                "Help me complete my pending assignments"
            ],
            "escalate_to_human": False
        }

    # Query: GPA, Thresholds & Academic Standing
    if any(k in q_lower for k in ["gpa", "threshold", "grade", "cgpa", "scale"]):
        status_text = "Good Standing"
        advice = ""
        if cgpa < 5.0:
            status_text = "Critical Academic Concern (< 5.0/10.0)"
            advice = (
                f"Your current CGPA is **{cgpa:.2f} / 10.00**. Because this is below the 5.0 institutional threshold, "
                "our system has flagged targeted support to protect your enrollment. Raising your GPA above 6.0 will move you "
                "out of the warning zone. Focus on your lowest-scoring subjects and attend faculty office hours."
            )
        elif cgpa < 6.0:
            status_text = "Academic Warning Zone (5.0 - 5.9 / 10.0)"
            advice = (
                f"Your current CGPA is **{cgpa:.2f} / 10.00**. You are currently just below the 6.00 threshold for comfortable academic standing. "
                "A modest boost of +0.5 to +0.8 in your latest semester GPA will move your record into the safe Routine Monitoring cohort."
            )
        elif cgpa < 8.0:
            status_text = "Satisfactory Academic Standing (6.0 - 7.9 / 10.0)"
            advice = (
                f"Your current CGPA is **{cgpa:.2f} / 10.00**. You are in good standing above the warning threshold. "
                "To reach Academic Distinction (>= 8.0/10), maintain active recall study habits and ensure assignments are submitted on time."
            )
        else:
            status_text = "Academic Distinction Standing (>= 8.0 / 10.0)"
            advice = (
                f"Outstanding work! Your current CGPA is **{cgpa:.2f} / 10.00**. You are in the top tier (Distinction) with minimal dropout probability."
            )

        return {
            "reply": (
                f"### Academic Threshold Analysis ({inst})\n\n"
                f"• **Current CGPA:** {cgpa:.2f} / 10.00\n"
                f"• **Standing Tier:** {status_text}\n"
                f"• **MITAOE Minimum for Good Standing:** 6.0 / 10.0\n\n"
                f"{advice}\n\n"
                f"Would you like to test hypothetical grade outcomes? Use the **What-If Academic Simulator**."
            ),
            "suggested_prompts": [
                "Explain my risk score",
                "What should I study today?",
                "Which subjects need more attention?"
            ],
            "escalate_to_human": cgpa < 5.0,
            "escalation_reason": "CGPA below 5.0 academic threshold" if cgpa < 5.0 else None
        }

    # Query: Explain Risk Score / Prediction
    if any(k in q_lower for k in ["risk", "prediction", "dropout", "score", "why is my score", "shap"]):
        return {
            "reply": (
                f"### Early-Warning Assessment Breakdown\n\n"
                f"Your current estimated Discontinuation Risk Score is **{risk_score:.1f} / 100** ({risk_cat} Risk Tier).\n\n"
                f"**How the AI calculates this:**\n"
                f"The predictive model evaluates non-linear relationships across your academic history, attendance ({att:.1f}%), "
                f"CGPA ({cgpa:.2f}/10), commute time ({profile.travel_time_minutes} min), and study commitment ({profile.study_hours_per_day or 2}h/day).\n\n"
                f"**Key factors that protect your academic success:**\n"
                f"1. **Attendance Rate:** Attending >= 80% of lectures provides the single strongest protective boost against academic discontinuation.\n"
                f"2. **Assignment Turnaround:** Submitting coursework within 24 hours of deadlines avoids late penalties.\n"
                f"3. **Milestone Completion:** Completing tasks in your personalized Recovery Plan steadily improves your retention trajectory.\n\n"
                f"Remember: This score is a hypothetical early-warning indicator to allocate support resources, not a guarantee of an outcome."
            ),
            "suggested_prompts": [
                "What should I study today?",
                "Which subjects need more attention?",
                "Create my weekly timetable"
            ],
            "escalate_to_human": risk_cat == "High",
            "escalation_reason": "High early-warning risk score threshold" if risk_cat == "High" else None
        }

    # Query: Human Advisor & Consultation
    if any(k in q_lower for k in ["advisor", "human", "tutor", "meeting", "consult", "appointment", "speak to a human"]):
        advisor_name = profile.assigned_advisor.full_name if profile.assigned_advisor else "Disha Malpure Ma'am (Computer Engineering)"
        return {
            "reply": (
                f"### Faculty Advisor Support at {inst}\n\n"
                f"Your assigned departmental faculty advisor is **{advisor_name}**.\n\n"
                f"**When to schedule an advisor consultation:**\n"
                f"• 1-on-1 concept review in difficult {dept} modules.\n"
                f"• Academic petition, attendance condonation, or course drop/add guidance.\n"
                f"• Personal, commute, or health circumstances requiring formal institutional accommodations.\n\n"
                f"You can submit a consultation request directly on the **Support Hub** page with your preferred date and meeting format."
            ),
            "suggested_prompts": [
                "Book consultation with my advisor",
                "What should I study today?",
                "Which subjects need more attention?"
            ],
            "escalate_to_human": True,
            "escalation_reason": "Student requested human faculty consultation"
        }

    # Default Academic Welcome
    enrolled_summary = f"{len(enrolled_courses)} confirmed MITAOE courses" if enrolled_courses else "Pending enrollment setup"
    return {
        "reply": (
            f"Hello! I am your **UDAAN AI Academic Guide**, personalized for **{inst} — {prog} ({year})**.\n\n"
            f"Currently, your record shows:\n"
            f"• **Current CGPA:** {cgpa:.2f} / 10.00 ({'Safe' if cgpa >= 6.0 else 'Warning Zone'})\n"
            f"• **Attendance Rate:** {att:.1f}%\n"
            f"• **Course Enrollments:** {enrolled_summary}\n"
            f"• **Early-Warning Status:** {risk_cat} Risk Tier\n\n"
            f"How can I assist you today? You can ask me what to study today, which subjects need attention, to generate your weekly schedule, or connect with your advisor."
        ),
        "suggested_prompts": [
            "What should I study today?",
            "Which of my current subjects needs more attention?",
            "Create a weekly timetable for my MITAOE semester",
            "Explain my risk score"
        ],
        "escalate_to_human": False
    }

@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI Academic Assistance Chatbot.
    Enriches user query with student academic profile, ML prediction record,
    active recovery milestones, verified MITAOE courses, assessments, and deadlines.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="UDAAN AI chatbot assistance is tailored for student accounts."
        )

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please complete your student profile before using the academic assistant."
        )

    pred = db.query(PredictionRecord).filter(
        PredictionRecord.student_id == profile.id,
        PredictionRecord.is_active == True
    ).first()

    plan = db.query(RecoveryPlan).filter(
        RecoveryPlan.student_id == profile.id,
        RecoveryPlan.status == "active"
    ).first()

    res_data = generate_ai_response(
        query=req.message,
        history=req.history or [],
        profile=profile,
        pred=pred,
        plan=plan,
        db=db
    )

    context_snap = {
        "student_id": profile.student_institutional_id,
        "cgpa_10": profile.cgpa,
        "attendance_rate": profile.attendance_rate,
        "risk_category": pred.risk_category if pred else "Unassessed",
        "department": profile.department
    }

    return ChatResponse(
        reply=res_data["reply"],
        suggested_prompts=res_data["suggested_prompts"],
        escalate_to_human=res_data.get("escalate_to_human", False),
        escalation_reason=res_data.get("escalation_reason"),
        context_snapshot=context_snap
    )

@router.get("/advisor-info", response_model=AdvisorInfoOut)
def get_my_advisor_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the student's assigned faculty advisor contact details,
    office hours, and available meeting modalities.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    advisor = profile.assigned_advisor
    if not advisor:
        # Fallback to default departmental faculty advisor
        advisor = db.query(User).filter(User.role == "advisor").first()

    return AdvisorInfoOut(
        advisor_id=advisor.id if advisor else None,
        name=advisor.full_name if advisor else "Disha Malpure Ma'am",
        email=advisor.email if advisor else "disha.malpure@mitaoe.ac.in",
        department=advisor.department if advisor else "School of Computer Engineering, MITAOE",
        office_hours="Mon & Thu 2:00 PM – 4:30 PM (Office 304, Computer Engineering Bldg, MITAOE)",
        available_modalities=["In-Person Office Hours", "Video Consultation (Google Meet)", "Async Academic Plan Review"]
    )

@router.post("/request-human-support", response_model=HumanSupportTicketOut)
def request_human_support(
    req: HumanSupportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a consultation/support ticket to the student's assigned faculty advisor.
    Generates an in-app notification for the advisor and logs the audit event.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    advisor_id = profile.assigned_advisor_id
    if not advisor_id:
        def_adv = db.query(User).filter(User.role == "advisor").first()
        advisor_id = def_adv.id if def_adv else current_user.id

    notes_with_urgency = f"[{req.urgency} Priority] {req.notes}" if req.urgency and req.urgency != "Normal" else req.notes
    intervention = AdvisorIntervention(
        advisor_id=advisor_id,
        student_id=profile.id,
        intervention_type=req.topic,
        status="requested_by_student",
        urgency=req.urgency,
        modality=req.modality,
        meeting_date=req.preferred_date,
        student_request_notes=notes_with_urgency
    )
    db.add(intervention)
    db.flush()

    # Notify advisor
    notif = InAppNotification(
        user_id=advisor_id,
        title=f"Support Request: {req.topic}",
        message=f"{current_user.full_name} ({profile.student_institutional_id}) requested {req.modality} assistance: {req.notes[:100]}...",
        type="meeting",
        action_url=f"/advisor/students/{profile.id}"
    )
    db.add(notif)
    db.commit()
    db.refresh(intervention)

    log_audit_event(
        db=db,
        action="HUMAN_SUPPORT_REQUESTED",
        resource_type="intervention",
        resource_id=str(intervention.id),
        user_id=current_user.id,
        details={"topic": req.topic, "urgency": req.urgency, "modality": req.modality}
    )

    advisor_user = db.query(User).filter(User.id == advisor_id).first()
    return HumanSupportTicketOut(
        id=intervention.id,
        topic=intervention.intervention_type,
        status=intervention.status,
        urgency=intervention.urgency,
        modality=intervention.modality,
        meeting_date=intervention.meeting_date,
        meeting_link_or_location=intervention.meeting_link_or_location,
        student_notes=intervention.student_request_notes,
        action_taken=intervention.action_taken,
        follow_up_notes=intervention.follow_up_notes,
        follow_up_tasks=intervention.follow_up_tasks,
        created_at=intervention.created_at,
        advisor_name=advisor_user.full_name if advisor_user else "Faculty Advisor"
    )

@router.get("/my-tickets", response_model=List[HumanSupportTicketOut])
def list_my_support_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all human support requests and consultation tickets for the current student.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []

    interventions = db.query(AdvisorIntervention).filter(
        AdvisorIntervention.student_id == profile.id
    ).order_by(AdvisorIntervention.created_at.desc()).all()

    results = []
    for i in interventions:
        adv = db.query(User).filter(User.id == i.advisor_id).first()
        results.append(HumanSupportTicketOut(
            id=i.id,
            topic=i.intervention_type,
            status=i.status,
            urgency=i.urgency or "Normal",
            modality=i.modality or "In-Person",
            meeting_date=i.meeting_date,
            meeting_link_or_location=i.meeting_link_or_location,
            student_notes=i.student_request_notes,
            action_taken=i.action_taken,
            follow_up_notes=i.follow_up_notes,
            follow_up_tasks=i.follow_up_tasks,
            created_at=i.created_at,
            advisor_name=adv.full_name if adv else "Assigned Advisor"
        ))

    return results

# --- Student Feedback on Recommendations & Support Effectiveness ---

@router.post("/feedback", response_model=SupportFeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_support_feedback(
    fb_in: SupportFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Records student rating and effectiveness feedback on recovery plans,
    learning resources, advisor meetings, or chatbot responses.
    """
    fb = SupportFeedback(
        user_id=current_user.id,
        feedback_type=fb_in.feedback_type,
        target_id=fb_in.target_id,
        target_title=fb_in.target_title,
        rating=fb_in.rating,
        effectiveness=fb_in.effectiveness,
        comments=fb_in.comments,
        created_at=datetime.now(timezone.utc)
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    log_audit_event(
        db=db,
        action="SUPPORT_FEEDBACK_SUBMITTED",
        resource_type="support_feedback",
        resource_id=str(fb.id),
        user_id=current_user.id,
        details={"type": fb.feedback_type, "rating": fb.rating}
    )

    return fb

@router.get("/feedback/my-feedback", response_model=List[SupportFeedbackOut])
def get_my_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all feedback submitted by the current student.
    """
    return db.query(SupportFeedback).filter(
        SupportFeedback.user_id == current_user.id
    ).order_by(SupportFeedback.created_at.desc()).all()

