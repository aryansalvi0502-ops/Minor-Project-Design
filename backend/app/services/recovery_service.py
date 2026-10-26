from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from backend.app.models.profile import StudentProfile
from backend.app.models.recovery import RecoveryPlan, RecoveryTask

class RecoveryPlanService:
    """
    Generates actionable, personalized academic recovery plans and custom timetables
    based on student metrics, verified indicators, and model explanation insights.
    """

    def generate_plan_data(
        self,
        profile: StudentProfile,
        risk_category: str,
        risk_score: float,
        top_risk_factors: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        identified_areas = []
        recommended_actions = []
        tasks = []
        weekly_goals = []

        # 1. Evaluate Attendance
        if profile.attendance_rate < 75.0:
            identified_areas.append(f"Critical Attendance Deficit ({profile.attendance_rate:.1f}%)")
            recommended_actions.append("Establish a minimum 85% attendance target over the next 4 weeks with weekly automated logs.")
            tasks.append({
                "title": "Establish Daily Class Attendance Check-in",
                "description": "Log attendance immediately following morning and afternoon lectures; contact instructor for missed syllabus notes.",
                "category": "attendance",
                "days_offset": 2
            })
            weekly_goals.append({
                "week": 1,
                "focus_area": "Attendance Recovery",
                "target": "Attend 100% of lectures this week without unexcused absence",
                "metric": "Weekly attendance >= 90%"
            })
        elif profile.attendance_rate < 85.0:
            identified_areas.append(f"Borderline Attendance ({profile.attendance_rate:.1f}%)")
            recommended_actions.append("Implement lecture pre-commitment routines to maintain attendance safely above institutional threshold.")
            tasks.append({
                "title": "Set 30-minute Pre-lecture Departure Alarms",
                "description": "Factor in commute time to arrive 10 minutes prior to lecture start.",
                "category": "attendance",
                "days_offset": 3
            })

        # 2. Evaluate Academic Performance (GPA, Semester GPA, CGPA on 10-point scale)
        min_gpa = min(profile.gpa, profile.semester_gpa, profile.cgpa)
        # Normalize to 10-point scale for uniform evaluation threshold
        gpa_10 = min_gpa if min_gpa > 4.0 else (min_gpa / 4.0 * 10.0)
        scale_label = "/10.0" if min_gpa > 4.0 else "/4.0"

        if gpa_10 < 5.0: # Below 5.0 out of 10.0 (equivalent to < 2.0 / 4.0)
            identified_areas.append(f"Academic Performance Concern (Lowest GPA: {min_gpa:.2f}{scale_label})")
            recommended_actions.append("Enroll in departmental peer-tutoring sessions and schedule concept-review blocks.")
            tasks.append({
                "title": "Schedule Peer Tutoring Consultation",
                "description": f"Book bi-weekly tutoring in core {profile.department} foundational courses.",
                "category": "academic",
                "days_offset": 4
            })
            tasks.append({
                "title": "Create Subject-wise Practice Question Bank",
                "description": "Solve 5 practice problems after every textbook lecture chapter.",
                "category": "academic",
                "days_offset": 7
            })
            weekly_goals.append({
                "week": 2,
                "focus_area": "Core Concept Mastery",
                "target": "Complete 2 tutor-guided review sessions and revise mid-term syllabus",
                "metric": "Quiz score >= 75%"
            })
        elif gpa_10 < 7.0: # 5.0 to 6.9 out of 10.0 (equivalent to 2.0 to 2.75 / 4.0)
            identified_areas.append(f"Moderate Academic Risk (Semester GPA: {profile.semester_gpa:.2f}{scale_label})")
            recommended_actions.append("Target a 0.5 GPA boost through structured active recall and office-hour clarifications.")
            tasks.append({
                "title": "Attend Faculty Office Hours",
                "description": "Bring 2 specific questions regarding recent challenging course concepts to instructor office hours.",
                "category": "academic",
                "days_offset": 5
            })

        # 3. Evaluate Assignment Delays
        if profile.assignment_delay_days >= 2:
            identified_areas.append(f"Assignment Turnaround Delays (Avg {profile.assignment_delay_days} days late)")
            recommended_actions.append("Deconstruct assignment prompts into smaller 48-hour milestones to eliminate late submission penalties.")
            tasks.append({
                "title": "Break Down Next Upcoming Assignment into 3 Milestones",
                "description": "Stage 1: Outline & Research; Stage 2: Rough Draft; Stage 3: Proofreading & Submission.",
                "category": "assignment",
                "days_offset": 3
            })
            weekly_goals.append({
                "week": 1,
                "focus_area": "On-Time Submissions",
                "target": "Submit all weekly coursework at least 6 hours before deadline",
                "metric": "0 late submissions"
            })

        # 4. Evaluate Study Hours
        study_hrs = profile.study_hours_per_day if profile.study_hours_per_day is not None else 2.5
        if study_hrs < 3.0:
            identified_areas.append(f"Low Independent Study Volume ({study_hrs:.1f} hrs/day)")
            recommended_actions.append("Establish dedicated 45-minute focused study blocks using the Pomodoro technique.")
            tasks.append({
                "title": "Implement Daily 2x45-Min Focus Study Blocks",
                "description": "Dedicate phone-free study blocks tailored to highest-credit coursework.",
                "category": "study_habits",
                "days_offset": 1
            })
            weekly_goals.append({
                "week": 3,
                "focus_area": "Study Consistency",
                "target": "Accumulate 20+ hours of focused self-study over the week",
                "metric": "Study log completion"
            })

        # 5. Evaluate Stress Index
        stress = profile.stress_index if profile.stress_index is not None else 5.0
        if stress >= 7.0:
            identified_areas.append(f"Elevated Stress Index ({stress:.1f}/10)")
            recommended_actions.append("Access confidential campus wellbeing support and workload balancing counseling.")
            tasks.append({
                "title": "Book Confidential Academic Advisor / Wellbeing Check-in",
                "description": "Discuss balancing coursework, part-time work, and study workload with an academic advisor.",
                "category": "wellness",
                "days_offset": 3
            })
            weekly_goals.append({
                "week": 2,
                "focus_area": "Stress Reduction",
                "target": "Complete 1 advisor strategy session and set structured sleep & relaxation boundaries",
                "metric": "Self-reported stress <= 6.0"
            })

        # Fallback if student is low risk and has no critical deficits
        if not identified_areas:
            identified_areas.append("Good Academic Standing — Preventive Maintenance")
            recommended_actions.append("Maintain high-attendance consistency, pursue advanced honors research, and plan internship goals.")
            tasks.append({
                "title": "Schedule Career / Academic Mentorship Goal Setting",
                "description": "Review next semester elective planning and internship applications.",
                "category": "academic",
                "days_offset": 7
            })
            weekly_goals.append({
                "week": 1,
                "focus_area": "Academic Excellence",
                "target": "Maintain current CGPA and prepare for forthcoming midterms",
                "metric": "Consistent 85%+ attendance"
            })

        # Generate custom timetable tailored to study hours & department
        timetable = self._generate_suggested_timetable(profile, study_hrs)

        # Plan title and metadata
        title = f"{risk_category} Risk Supportive Recovery Plan — {profile.department} ({profile.semester})"
        review_date = datetime.now(timezone.utc) + timedelta(days=21)

        return {
            "title": title,
            "risk_level": risk_category,
            "status": "active",
            "identified_areas": identified_areas,
            "recommended_actions": recommended_actions,
            "weekly_goals": weekly_goals,
            "suggested_timetable": timetable,
            "review_date": review_date,
            "tasks": tasks
        }

    def _generate_suggested_timetable(self, profile: StudentProfile, daily_study_hours: float) -> Dict[str, Any]:
        dept = profile.department or "General"
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        # Course topics tailored by department
        dept_courses = {
            "CS": ["Data Structures & Algorithms", "Operating Systems", "Discrete Mathematics", "Database Lab"],
            "Engineering": ["Thermodynamics / Circuits", "Engineering Mathematics", "Material Science", "Lab Practice"],
            "Business": ["Financial Accounting", "Microeconomics", "Business Analytics", "Marketing Principles"],
            "Science": ["Calculus & Analysis", "Organic / Physical Chemistry", "Physics Principles", "Experimental Lab"],
            "Arts": ["Literature & Composition", "History & Philosophy", "Research Methods", "Seminar Essay Writing"]
        }
        courses = dept_courses.get(dept, ["Core Subject A", "Core Subject B", "Core Subject C", "Applied Lab"])

        timetable = {}
        for i, day in enumerate(days):
            if day in ["Monday", "Wednesday", "Friday"]:
                timetable[day] = [
                    {"time": "09:00 - 12:00", "slot": "Morning", "activity": "Lecture Attendance", "subject": courses[0]},
                    {"time": "13:30 - 15:30", "slot": "Afternoon", "activity": "Department Lab / Workshop", "subject": courses[3]},
                    {"time": "17:00 - 18:30", "slot": "Evening", "activity": "Active Recall & Problem Sets", "subject": courses[0]},
                    {"time": "19:30 - 20:30", "slot": "Night", "activity": "Assignment Draft & Preview", "subject": courses[1]}
                ]
            elif day in ["Tuesday", "Thursday"]:
                timetable[day] = [
                    {"time": "10:00 - 12:30", "slot": "Morning", "activity": "Lecture Attendance", "subject": courses[1]},
                    {"time": "14:00 - 16:00", "slot": "Afternoon", "activity": "Faculty Office Hours / Tutoring", "subject": courses[2]},
                    {"time": "17:30 - 19:30", "slot": "Evening", "activity": "Focused Problem Solving", "subject": courses[2]}
                ]
            elif day == "Saturday":
                timetable[day] = [
                    {"time": "10:00 - 12:00", "slot": "Morning", "activity": "Weekly Synthesis & Flashcards", "subject": "All Courses"},
                    {"time": "14:00 - 16:30", "slot": "Afternoon", "activity": "Assignment Finalization & Submission", "subject": "Upcoming Deadlines"},
                    {"time": "Evening", "slot": "Evening", "activity": "Rest & Social Wellbeing", "subject": "Recreation"}
                ]
            else: # Sunday
                timetable[day] = [
                    {"time": "11:00 - 13:00", "slot": "Morning", "activity": "Week Ahead Planning & Note Organization", "subject": "Weekly Planner"},
                    {"time": "16:00 - 17:30", "slot": "Afternoon", "activity": "Light Reading & Pre-lecture Prep", "subject": courses[0]},
                    {"time": "Evening", "slot": "Evening", "activity": "Sleep Hygiene & Relaxation", "subject": "Personal Wellness"}
                ]
        return timetable

recovery_service = RecoveryPlanService()
