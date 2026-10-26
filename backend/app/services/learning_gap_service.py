from typing import List, Dict, Any
from backend.app.models.academic_marks import SubjectAssessment
from backend.app.schemas.profile import (
    ConceptGapOut,
    SubjectSummaryOut,
    LearningGapReportOut,
    SubjectAssessmentOut
)

class LearningGapAnalysisService:
    """
    Performs empirical learning-gap analysis on actual subject-level marks and assessments.
    Diagnoses weak topics, concept mastery status, and actionable academic remediations.
    """

    def analyze_student_gaps(
        self,
        assessments: List[SubjectAssessment],
        enrollments: Optional[List[Any]] = None
    ) -> LearningGapReportOut:
        if not assessments and not enrollments:
            return LearningGapReportOut(
                overall_academic_average=0.0,
                total_assessments_recorded=0,
                subjects_summary=[],
                critical_concept_gaps=[],
                actionable_remediations=["No subject assessment records found. Log your recent exam or assignment scores to identify learning gaps."]
            )

        # 1. Group assessments by subject
        subject_map: Dict[str, Dict[str, Any]] = {}
        for a in assessments:
            code = a.subject_code
            if code not in subject_map:
                subject_map[code] = {
                    "code": code,
                    "name": a.subject_name,
                    "assessments": [],
                    "total_weighted_score": 0.0,
                    "total_weight": 0.0
                }
            pct = (a.obtained_score / a.max_score) * 100.0 if a.max_score > 0 else 0.0
            wt = a.weight_percentage if a.weight_percentage > 0 else 1.0
            subject_map[code]["assessments"].append(a)
            subject_map[code]["total_weighted_score"] += pct * wt
            subject_map[code]["total_weight"] += wt

        # 2. Build subject summaries and extract topic breakdowns
        subjects_summary = []
        topic_scores: Dict[str, List[Dict[str, Any]]] = {}
        total_overall_pct = 0.0

        for code, data in subject_map.items():
            overall_pct = data["total_weighted_score"] / data["total_weight"] if data["total_weight"] > 0 else 0.0
            total_overall_pct += overall_pct

            # Letter grade
            if overall_pct >= 85.0:
                letter = "A"
                status = "Mastered"
            elif overall_pct >= 75.0:
                letter = "B"
                status = "Satisfactory"
            elif overall_pct >= 60.0:
                letter = "C"
                status = "Needs Attention"
            else:
                letter = "D/F"
                status = "Critical Deficit"

            weak_topics_for_sub = []
            for a in data["assessments"]:
                if a.topic_breakdown and isinstance(a.topic_breakdown, list):
                    for tb in a.topic_breakdown:
                        topic_name = tb.get("topic", "General Topic")
                        score = float(tb.get("score", 0.0))
                        max_s = float(tb.get("max", 100.0))
                        pct_topic = (score / max_s * 100.0) if max_s > 0 else 0.0

                        if topic_name not in topic_scores:
                            topic_scores[topic_name] = []
                        topic_scores[topic_name].append({
                            "subject_code": code,
                            "subject_name": data["name"],
                            "percentage": pct_topic
                        })

                        if pct_topic < 65.0 and topic_name not in weak_topics_for_sub:
                            weak_topics_for_sub.append(topic_name)

            subjects_summary.append(SubjectSummaryOut(
                subject_code=code,
                subject_name=data["name"],
                overall_percentage=round(overall_pct, 1),
                letter_grade=letter,
                assessment_count=len(data["assessments"]),
                mastery_status=status,
                weak_topics=weak_topics_for_sub
            ))

        overall_average = total_overall_pct / len(subject_map) if subject_map else 0.0

        # 3. Formulate concept gaps
        concept_gaps = []
        for topic, entries in topic_scores.items():
            avg_score = sum(e["percentage"] for e in entries) / len(entries)
            if avg_score < 70.0:
                sub_code = entries[0]["subject_code"]
                sub_name = entries[0]["subject_name"]

                if avg_score < 50.0:
                    severity = "Critical Gap"
                    action = f"Immediate tutoring review required on {topic}. Solve 5 practice problems with instructor."
                elif avg_score < 60.0:
                    severity = "Moderate Deficit"
                    action = f"Schedule 2 dedicated study blocks for {topic} using textbook synthesis notes."
                else:
                    severity = "Needs Reinforcement"
                    action = f"Review active recall flashcards on {topic} before upcoming exam."

                concept_gaps.append(ConceptGapOut(
                    topic=topic,
                    subject_code=sub_code,
                    subject_name=sub_name,
                    average_score=round(avg_score, 1),
                    severity=severity,
                    recommended_action=action,
                    recommended_resource_query=f"{sub_code} {topic}"
                ))

        # Incorporate enrolled courses that may not yet have formal assessments
        if enrollments:
            for en in enrollments:
                code = en.course_code
                if code not in subject_map:
                    status = "Needs Attention" if en.confidence_level == "Low" else "Awaiting Assessment"
                    subjects_summary.append(SubjectSummaryOut(
                        subject_code=code,
                        subject_name=en.course_title,
                        overall_percentage=0.0,
                        letter_grade="P",
                        assessment_count=0,
                        mastery_status=status,
                        weak_topics=en.difficult_topics or []
                    ))

                    if en.difficult_topics:
                        for dt in en.difficult_topics:
                            if not any(cg.topic == dt and cg.subject_code == code for cg in concept_gaps):
                                concept_gaps.append(ConceptGapOut(
                                    topic=dt,
                                    subject_code=code,
                                    subject_name=en.course_title,
                                    average_score=55.0 if en.confidence_level == "Low" else 65.0,
                                    severity="Moderate Deficit" if en.confidence_level == "Low" else "Needs Reinforcement",
                                    recommended_action=f"Self-reported focus area in {code}. Review syllabus modules and practice sample exercises.",
                                    recommended_resource_query=f"{code} {dt}"
                                ))

        # Sort gaps by lowest score first
        concept_gaps.sort(key=lambda x: x.average_score)

        # 4. Formulate overall actionable remediations
        remediations = []
        if any(s.mastery_status == "Critical Deficit" for s in subjects_summary):
            remediations.append("Priority Focus: Enroll in peer tutoring for courses with Critical Deficits (< 60% mark).")
        if concept_gaps:
            top_gap = concept_gaps[0]
            remediations.append(f"Remediate Highest Deficit: Dedicate your next study session to '{top_gap.topic}' in {top_gap.subject_code} (Average: {top_gap.average_score}%).")
        remediations.append("Deconstruct upcoming problem sets into 48-hour sub-milestones to eliminate last-minute rushes.")
        remediations.append("Bring your lowest scoring quiz questions to faculty office hours for 1-on-1 walkthrough.")

        return LearningGapReportOut(
            overall_academic_average=round(overall_average, 1),
            total_assessments_recorded=len(assessments),
            subjects_summary=subjects_summary,
            critical_concept_gaps=concept_gaps,
            actionable_remediations=remediations
        )

learning_gap_service = LearningGapAnalysisService()
