from typing import List, Dict, Any, Optional

class AdaptiveTimetableService:
    """
    Intelligently generates and adjusts student weekly schedules respecting:
    1. Fixed class lectures & laboratories
    2. Student availability preferences (preferred study hours, blocked work/personal shifts)
    3. Urgent coursework deadlines
    4. Academic learning gaps (allocating more study blocks to weaker subjects)
    """

    DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    WINDOW_SLOTS = {
        "Morning": [("08:00", "09:00"), ("09:00", "10:30"), ("10:30", "12:00")],
        "Afternoon": [("13:30", "15:00"), ("15:00", "16:30"), ("16:30", "17:30")],
        "Evening": [("17:30", "19:00"), ("19:00", "20:30"), ("20:30", "21:30")],
        "Night": [("20:30", "22:00"), ("22:00", "23:00")]
    }

    def generate_adaptive_schedule(
        self,
        class_schedule: List[Dict[str, Any]],
        blocked_slots: List[Dict[str, Any]],
        daily_study_goal_hours: float = 3.0,
        preferred_window: str = "Evening",
        weak_subjects: Optional[List[str]] = None,
        deadlines: Optional[List[Dict[str, Any]]] = None,
        enrolled_subjects: Optional[List[str]] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        weak_subjects = weak_subjects or []
        deadlines = deadlines or []
        enrolled_subjects = enrolled_subjects or []
        
        # Build priority queue of subjects to study:
        # 1. Upcoming deadlines / exam prep
        # 2. Identified weak subjects needing recovery
        # 3. Other verified enrolled MITAOE semester courses
        subject_priority = []
        for d in deadlines:
            code = d.get("subject_code")
            if code and code not in subject_priority:
                subject_priority.append(code)
        for w in weak_subjects:
            if w not in subject_priority:
                subject_priority.append(w)
        for e in enrolled_subjects:
            if e not in subject_priority:
                subject_priority.append(e)
        if not subject_priority:
            subject_priority = ["Core Coursework", "General Revision", "Concept Practice"]

        adaptive_schedule = {}

        # Index classes and blocked slots by day
        classes_by_day = {day: [] for day in self.DAYS_ORDER}
        for item in class_schedule:
            day = item.get("day")
            if day in classes_by_day:
                classes_by_day[day].append(item)

        blocked_by_day = {day: [] for day in self.DAYS_ORDER}
        for item in blocked_slots:
            day = item.get("day")
            if day in blocked_by_day:
                blocked_by_day[day].append(item)

        subject_idx = 0

        for day in self.DAYS_ORDER:
            day_agenda = []

            # 1. Add Fixed Classes
            for c in classes_by_day[day]:
                start = c.get("start", "09:00")
                end = c.get("end", "11:00")
                day_agenda.append({
                    "time": f"{start} - {end}",
                    "slot": self._infer_slot(start),
                    "type": "class",
                    "activity": "Lecture / Lab Attendance",
                    "subject": c.get("subject", "Course Lecture"),
                    "code": c.get("code", ""),
                    "location": c.get("room", "Campus"),
                    "is_movable": False
                })

            # 2. Add Blocked Personal / Work Commitments
            for b in blocked_by_day[day]:
                start = b.get("start", "10:00")
                end = b.get("end", "14:00")
                day_agenda.append({
                    "time": f"{start} - {end}",
                    "slot": self._infer_slot(start),
                    "type": "commitment",
                    "activity": b.get("label", "Personal Commitment / Job"),
                    "subject": "Unavailable Block",
                    "code": "",
                    "location": "External",
                    "is_movable": False
                })

            # 3. Schedule Adaptive Study Sessions in Preferred Windows
            allocated_study_mins = 0
            target_study_mins = int(daily_study_goal_hours * 60)

            # Weekends might target slightly lighter self-study unless deadlines are near
            if day in ["Saturday", "Sunday"] and not deadlines:
                target_study_mins = min(target_study_mins, 120)

            candidate_windows = [preferred_window]
            for w in ["Evening", "Afternoon", "Morning", "Night"]:
                if w not in candidate_windows:
                    candidate_windows.append(w)

            for win in candidate_windows:
                if allocated_study_mins >= target_study_mins:
                    break
                slots = self.WINDOW_SLOTS.get(win, [])
                for start_t, end_t in slots:
                    if allocated_study_mins >= target_study_mins:
                        break
                    if not self._overlaps(start_t, end_t, day_agenda):
                        current_sub = subject_priority[subject_idx % len(subject_priority)]
                        is_weak = current_sub in weak_subjects
                        has_deadline = any(d.get("subject_code") == current_sub for d in deadlines)

                        if has_deadline:
                            activity = f"Deadline Milestone Sprint ({current_sub})"
                        elif is_weak:
                            activity = f"Targeted Concept Mastery & Problem Sets ({current_sub})"
                        else:
                            activity = f"Active Recall & Summary Notes ({current_sub})"

                        day_agenda.append({
                            "time": f"{start_t} - {end_t}",
                            "slot": win,
                            "type": "study",
                            "activity": activity,
                            "subject": current_sub,
                            "code": current_sub,
                            "location": "Quiet Study / Library",
                            "is_movable": True,
                            "focus_area": "Learning Gap Remediation" if is_weak else "Coursework"
                        })
                        subject_idx += 1
                        # Estimate slot duration (approx 75-90 mins)
                        allocated_study_mins += 75

            # 4. Add structured rest / wellbeing block if day is not overwhelmed
            if day in ["Friday", "Saturday", "Sunday"]:
                day_agenda.append({
                    "time": "21:30 - 22:30",
                    "slot": "Night",
                    "type": "wellness",
                    "activity": "Restoration, Social Wellbeing & Sleep Preparation",
                    "subject": "Mental Health & Balance",
                    "code": "WELLNESS",
                    "location": "Home / Relaxation",
                    "is_movable": True
                })

            # Sort chronological by start time
            day_agenda.sort(key=lambda x: x["time"].split(" - ")[0])
            adaptive_schedule[day] = day_agenda

        return adaptive_schedule

    def _infer_slot(self, start_time: str) -> str:
        try:
            hour = int(start_time.split(":")[0])
            if hour < 12:
                return "Morning"
            elif hour < 17:
                return "Afternoon"
            elif hour < 20:
                return "Evening"
            else:
                return "Night"
        except Exception:
            return "Day"

    def _overlaps(self, start_t: str, end_t: str, agenda: List[Dict[str, Any]]) -> bool:
        def to_mins(t_str):
            parts = t_str.strip().split(":")
            return int(parts[0]) * 60 + int(parts[1])

        try:
            s_mins = to_mins(start_t)
            e_mins = to_mins(end_t)
            for item in agenda:
                times = item["time"].split(" - ")
                if len(times) == 2:
                    item_s = to_mins(times[0])
                    item_e = to_mins(times[1])
                    if max(s_mins, item_s) < min(e_mins, item_e):
                        return True
            return False
        except Exception:
            return False

timetable_service = AdaptiveTimetableService()
