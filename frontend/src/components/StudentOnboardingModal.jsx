import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Modal } from "./Modal";
import {
  Sparkles,
  BookOpen,
  Calendar,
  Bell,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
  GraduationCap,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";

export function StudentOnboardingModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(false);
  const [error, setError] = useState("");

  // Academic Program Catalog
  const [programs, setPrograms] = useState([]);
  const [catalogCourses, setCatalogCourses] = useState([]);

  // Selected enrollments in Step 2: array of { course_code, course_title, semester, course_id, enrollment_type, is_confirmed, confidence_level, difficult_topics_text, academic_goal }
  const [enrollments, setEnrollments] = useState([]);
  const [customCourse, setCustomCourse] = useState({ code: "", title: "", type: "Elective" });
  const [showAddCustom, setShowAddCustom] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: MITAOE Academic Identity
    institution: "MITAOE",
    degree_program: "Computer Engineering",
    admission_batch: "2023-2027",
    department: "School of Computer Engineering and Technology",
    semester_num: 3, // 1 to 8
    curriculum_version: "Autonomous 2022",
    student_institutional_id: "",
    cgpa: 7.2,
    semester_gpa: 7.0,

    // Step 3: Habits & Availability
    attendance_rate: 82.0,
    study_hours_per_day: 3.0,
    travel_time_minutes: 25,
    preferred_study_window: "Evening",
    stress_index: 4.5,
    assignment_delay_days: 0,

    // Step 4: Notification Preferences
    email_enabled: true,
    in_app_enabled: true,
    assignment_lead_hours: 24,
  });

  // Load programs on mount
  useEffect(() => {
    async function initPrograms() {
      try {
        const progs = await api.curriculum.getPrograms().catch(() => []);
        if (progs && progs.length > 0) {
          setPrograms(progs);
        } else {
          setPrograms([
            { id: 1, program_name: "Computer Engineering", department: "School of Computer Engineering and Technology" },
            { id: 2, program_name: "Computer Science & Engineering (Artificial Intelligence and Machine Learning)", department: "School of Computer Engineering and Technology" },
            { id: 3, program_name: "Computer Science & Engineering (Data Science)", department: "School of Computer Engineering and Technology" },
            { id: 4, program_name: "Information Technology", department: "School of Computer Engineering and Technology" },
            { id: 5, program_name: "Electronics and Telecommunication Engineering", department: "School of Electrical Engineering" },
            { id: 6, program_name: "Mechanical Engineering", department: "School of Mechanical and Civil Engineering" },
            { id: 7, program_name: "Civil Engineering", department: "School of Mechanical and Civil Engineering" },
            { id: 8, program_name: "Chemical Engineering", department: "School of Chemical Engineering" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load programs:", err);
      }
    }
    if (isOpen) {
      initPrograms();
    }
  }, [isOpen]);

  // Fetch official courses when program or semester changes
  useEffect(() => {
    async function loadOfficialCourses() {
      if (!formData.degree_program || !formData.semester_num) return;
      try {
        setFetchingCourses(true);
        const courses = await api.curriculum.getCourses({
          program_name: formData.degree_program,
          semester: formData.semester_num,
          curriculum_version: formData.curriculum_version,
        }).catch(() => []);

        setCatalogCourses(courses || []);

        // Initialize student enrollment selections
        if (courses && courses.length > 0) {
          const initialSelections = courses.map((c) => ({
            course_id: c.id,
            course_code: c.course_code,
            course_title: c.course_title,
            semester: c.semester,
            credits: c.credits,
            enrollment_type: c.course_type || "Core",
            is_confirmed: true,
            confidence_level: "Medium",
            difficult_topics_text: "",
            academic_goal: "Target Grade A (80%+)",
          }));
          setEnrollments(initialSelections);
        } else {
          setEnrollments([]);
        }
      } catch (err) {
        console.error("Failed to load official courses:", err);
      } finally {
        setFetchingCourses(false);
      }
    }
    if (step >= 1) {
      loadOfficialCourses();
    }
  }, [formData.degree_program, formData.semester_num, formData.curriculum_version, step]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "degree_program") {
        const found = programs.find((p) => p.program_name === value);
        if (found) updated.department = found.department;
      }
      return updated;
    });
  };

  const handleEnrollmentToggle = (index) => {
    setEnrollments((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, is_confirmed: !item.is_confirmed } : item
      )
    );
  };

  const handleEnrollmentChange = (index, field, val) => {
    setEnrollments((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: val } : item
      )
    );
  };

  const handleAddCustomCourse = (e) => {
    e.preventDefault();
    if (!customCourse.code.trim() || !customCourse.title.trim()) return;
    setEnrollments((prev) => [
      ...prev,
      {
        course_id: null,
        course_code: customCourse.code.toUpperCase().trim(),
        course_title: customCourse.title.trim(),
        semester: Number(formData.semester_num),
        credits: 3.0,
        enrollment_type: customCourse.type || "Elective",
        is_confirmed: true,
        confidence_level: "Medium",
        difficult_topics_text: "",
        academic_goal: "Target Grade A (80%+)",
      },
    ]);
    setCustomCourse({ code: "", title: "", type: "Elective" });
    setShowAddCustom(false);
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError("");

    // Step 1 Validation
    if (step === 1) {
      if (!formData.student_institutional_id.trim()) {
        setError("Please enter your official MITAOE PRN or Student ID.");
        return;
      }
      if (formData.cgpa < 0 || formData.cgpa > 10) {
        setError("Cumulative GPA must be between 0.0 and 10.0.");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 Validation (Course Confirmation)
    if (step === 2) {
      const confirmedCount = enrollments.filter((e) => e.is_confirmed).length;
      if (confirmedCount === 0) {
        setError("Please confirm at least one enrolled course for your active semester.");
        return;
      }
      setStep(3);
      return;
    }

    // Step 3 Validation (Habits & Availability)
    if (step === 3) {
      if (formData.attendance_rate < 0 || formData.attendance_rate > 100) {
        setError("Attendance rate must be between 0% and 100%.");
        return;
      }
      setStep(4);
      return;
    }

    // Step 4: Submission
    handleSubmit();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const semLabel = `Semester ${formData.semester_num}`;

      // 1. Save or Update Student Profile with MITAOE curriculum fields
      const profilePayload = {
        student_institutional_id: formData.student_institutional_id.trim(),
        department: formData.department,
        semester: semLabel,
        institution: "MITAOE",
        degree_program: formData.degree_program,
        admission_batch: formData.admission_batch,
        curriculum_version: formData.curriculum_version,
        age: 20.0,
        gender: "Female",
        family_income: 45000.0,
        internet_access: "Yes",
        attendance_rate: parseFloat(formData.attendance_rate),
        study_hours_per_day: parseFloat(formData.study_hours_per_day),
        travel_time_minutes: parseFloat(formData.travel_time_minutes),
        part_time_job: "No",
        scholarship: "No",
        stress_index: parseFloat(formData.stress_index),
        gpa: parseFloat(formData.cgpa),
        semester_gpa: parseFloat(formData.semester_gpa),
        cgpa: parseFloat(formData.cgpa),
        parental_education: "Bachelor",
        assignment_delay_days: parseInt(formData.assignment_delay_days || 0),
      };

      // Try update first, fallback to create
      try {
        await api.profiles.updateMyProfile(profilePayload);
      } catch {
        await api.profiles.createProfile(profilePayload);
      }

      // 2. Batch save confirmed MITAOE course enrollments
      const confirmedToSave = enrollments
        .filter((item) => item.is_confirmed)
        .map((item) => {
          const diffList = item.difficult_topics_text
            ? item.difficult_topics_text.split(",").map((t) => t.trim()).filter(Boolean)
            : [];
          return {
            course_id: item.course_id,
            course_code: item.course_code,
            course_title: item.course_title,
            semester: Number(formData.semester_num),
            enrollment_type: item.enrollment_type,
            is_confirmed: true,
            confidence_level: item.confidence_level || "Medium",
            difficult_topics: diffList,
            academic_goal: item.academic_goal || "Target Grade A (80%+)",
          };
        });

      if (confirmedToSave.length > 0) {
        await api.curriculum.batchSaveEnrollments(confirmedToSave).catch((err) => {
          console.warn("Enrollment batch save note:", err);
        });
      }

      // 3. Set Adaptive Timetable Preferences
      await api.recovery.updateTimetableConfig({
        daily_study_goal_hours: parseFloat(formData.study_hours_per_day),
        preferred_study_window: formData.preferred_study_window,
        blocked_slots: [],
      }).catch(() => null);

      // 4. Set Notification Preferences
      await api.notifications.updatePreferences({
        email_enabled: formData.email_enabled,
        in_app_enabled: formData.in_app_enabled,
        assignment_lead_hours: formData.assignment_lead_hours,
        study_session_reminders: true,
        advisor_meeting_reminders: true,
      }).catch(() => null);

      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to initialize profile. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MITAOE Student Academic Onboarding">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: "320px" }}>
        {/* Step Indicator */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {[
            { num: 1, label: "Program & Batch" },
            { num: 2, label: "Confirm Courses" },
            { num: 3, label: "Study Schedule" },
            { num: 4, label: "Reminders" },
          ].map((s) => (
            <div
              key={s.num}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                opacity: step >= s.num ? 1 : 0.4,
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: step >= s.num ? "var(--accent-primary)" : "var(--border-subtle)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  transition: "all 0.2s ease",
                }}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, textAlign: "center" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "var(--risk-high-accent)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.825rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: MITAOE Academic Identity */}
        {step === 1 && (
          <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <GraduationCap size={18} color="var(--accent-primary)" />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>MIT Academy of Engineering (MITAOE)</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Alandi, Pune — Autonomous Institution</div>
                </div>
              </div>
              <span className="badge badge-accent" style={{ fontSize: "0.7rem" }}>Verified Catalog</span>
            </div>

            <div className="form-group">
              <label className="form-label">Degree / Academic Program *</label>
              <select
                value={formData.degree_program}
                onChange={(e) => handleChange("degree_program", e.target.value)}
                className="form-select"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.program_name}>
                    {p.program_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Current Semester *</label>
                <select
                  value={formData.semester_num}
                  onChange={(e) => handleChange("semester_num", Number(e.target.value))}
                  className="form-select"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem} {sem <= 2 ? "(First Year)" : sem <= 4 ? "(Second Year)" : sem <= 6 ? "(Third Year)" : "(Final Year)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Admission Batch *</label>
                <select
                  value={formData.admission_batch}
                  onChange={(e) => handleChange("admission_batch", e.target.value)}
                  className="form-select"
                >
                  <option value="2024-2028">2024–2028 (Batch 2024)</option>
                  <option value="2023-2027">2023–2027 (Batch 2023)</option>
                  <option value="2022-2026">2022–2026 (Batch 2022)</option>
                  <option value="2021-2025">2021–2025 (Batch 2021)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Student PRN / ID Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-2024-001 or 20230104001"
                  value={formData.student_institutional_id}
                  onChange={(e) => handleChange("student_institutional_id", e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Curriculum Version</label>
                <select
                  value={formData.curriculum_version}
                  onChange={(e) => handleChange("curriculum_version", e.target.value)}
                  className="form-select"
                >
                  <option value="Autonomous 2022">Autonomous 2022</option>
                  <option value="Autonomous 2024">Autonomous 2024</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Current CGPA (0.0 to 10.0)</label>
                <input
                  type="number"
                  min="0.0"
                  max="10.0"
                  step="0.05"
                  value={formData.cgpa}
                  onChange={(e) => handleChange("cgpa", e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Recent Semester GPA</label>
                <input
                  type="number"
                  min="0.0"
                  max="10.0"
                  step="0.05"
                  value={formData.semester_gpa}
                  onChange={(e) => handleChange("semester_gpa", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary">
                <span>Next: Confirm MITAOE Courses</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: MITAOE Course Enrollment Confirmation */}
        {step === 2 && (
          <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                  Official Courses for Semester {formData.semester_num}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {formData.degree_program}
                </span>
              </div>
              <p style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>
                Verified curriculum from MITAOE course structure. Check your enrolled courses and indicate any challenging topics.
              </p>
            </div>

            {fetchingCourses ? (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                Loading official MITAOE curriculum...
              </div>
            ) : enrollments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                No catalog courses found for this specific semester. Click "Add Custom Course" below.
              </div>
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem", paddingRight: "0.25rem" }}>
                {enrollments.map((course, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: course.is_confirmed ? "var(--bg-surface)" : "var(--bg-subtle)",
                      border: `1px solid ${course.is_confirmed ? "var(--border-subtle)" : "transparent"}`,
                      opacity: course.is_confirmed ? 1 : 0.6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={course.is_confirmed}
                          onChange={() => handleEnrollmentToggle(idx)}
                          style={{ width: 16, height: 16, accentColor: "var(--accent-primary)" }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                            {course.course_code}: {course.course_title}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            Type: {course.enrollment_type} | Credits: {course.credits || 3.0}
                          </div>
                        </div>
                      </label>
                      <span className="badge badge-subtle" style={{ fontSize: "0.68rem" }}>
                        {course.enrollment_type}
                      </span>
                    </div>

                    {course.is_confirmed && (
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "0.5rem", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border-subtle)" }}>
                        <div>
                          <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>
                            Confidence Level
                          </label>
                          <select
                            value={course.confidence_level}
                            onChange={(e) => handleEnrollmentChange(idx, "confidence_level", e.target.value)}
                            className="form-select"
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem" }}
                          >
                            <option value="High">High Confidence</option>
                            <option value="Medium">Medium Confidence</option>
                            <option value="Low">Low (Needs Support)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>
                            Challenging Topics (comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Graph Algorithms, Pointers"
                            value={course.difficult_topics_text || ""}
                            onChange={(e) => handleEnrollmentChange(idx, "difficult_topics_text", e.target.value)}
                            className="form-input"
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Elective Button */}
            {!showAddCustom ? (
              <button
                type="button"
                onClick={() => setShowAddCustom(true)}
                className="btn btn-secondary"
                style={{ fontSize: "0.78rem", alignSelf: "flex-start", padding: "0.4rem 0.75rem" }}
              >
                <Plus size={14} />
                <span>Add Elective / Other Subject</span>
              </button>
            ) : (
              <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-subtle)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>Add Elective Course</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Code (e.g. CS331)"
                    value={customCourse.code}
                    onChange={(e) => setCustomCourse((p) => ({ ...p, code: e.target.value }))}
                    className="form-input"
                    style={{ fontSize: "0.75rem" }}
                  />
                  <input
                    type="text"
                    placeholder="Course Title"
                    value={customCourse.title}
                    onChange={(e) => setCustomCourse((p) => ({ ...p, title: e.target.value }))}
                    className="form-input"
                    style={{ fontSize: "0.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCourse}
                    className="btn btn-primary"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
              <button type="submit" className="btn btn-primary">
                <span>Continue: Study Schedule</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Study Habits & Availability */}
        {step === 3 && (
          <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
              Customize your study bandwidth. The system schedules study blocks around your lectures and commitments.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Current Attendance Rate (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.attendance_rate}
                  onChange={(e) => handleChange("attendance_rate", e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Daily Self-Study Hours *</label>
                <input
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={formData.study_hours_per_day}
                  onChange={(e) => handleChange("study_hours_per_day", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Preferred Study Window</label>
                <select
                  value={formData.preferred_study_window}
                  onChange={(e) => handleChange("preferred_study_window", e.target.value)}
                  className="form-select"
                >
                  <option value="Morning">Morning (07:00 – 12:00)</option>
                  <option value="Afternoon">Afternoon (13:00 – 17:00)</option>
                  <option value="Evening">Evening (17:30 – 21:00)</option>
                  <option value="Night">Night (21:00 – 23:30)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Daily Transit Time (mins)</label>
                <input
                  type="number"
                  min="0"
                  max="240"
                  step="5"
                  value={formData.travel_time_minutes}
                  onChange={(e) => handleChange("travel_time_minutes", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Self-Reported Stress Level (1.0 to 10.0)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={formData.stress_index}
                  onChange={(e) => handleChange("stress_index", e.target.value)}
                  style={{ flex: 1, accentColor: "var(--accent-primary)" }}
                />
                <span style={{ fontWeight: 800, fontSize: "0.9rem", minWidth: "30px" }}>
                  {formData.stress_index}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <button type="button" onClick={() => setStep(2)} className="btn btn-secondary">
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
              <button type="submit" className="btn btn-primary">
                <span>Continue: Reminders</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Notification Preferences & Confirmation */}
        {step === 4 && (
          <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
              Confirm your notification settings to receive upcoming assignment alerts and adaptive schedule digests.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-subtle)",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>In-App Notifications</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Portal alert bell for upcoming deadlines and study blocks</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.in_app_enabled}
                  onChange={(e) => handleChange("in_app_enabled", e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary)" }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-subtle)",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Email Summaries</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Weekly study timetable & recovery milestone digests</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.email_enabled}
                  onChange={(e) => handleChange("email_enabled", e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary)" }}
                />
              </label>
            </div>

            {/* Summary preview */}
            <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", fontSize: "0.775rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>Setup Summary:</div>
              <div>• <strong>Institution:</strong> MIT Academy of Engineering, Alandi</div>
              <div>• <strong>Program:</strong> {formData.degree_program} (Semester {formData.semester_num})</div>
              <div>• <strong>Confirmed Courses:</strong> {enrollments.filter((e) => e.is_confirmed).length} courses selected</div>
              <div>• <strong>Study Bandwidth:</strong> {formData.study_hours_per_day} hrs/day ({formData.preferred_study_window})</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <button type="button" onClick={() => setStep(3)} className="btn btn-secondary">
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                <Sparkles size={15} />
                <span>{loading ? "Personalizing Portal..." : "Complete Setup & Launch"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
