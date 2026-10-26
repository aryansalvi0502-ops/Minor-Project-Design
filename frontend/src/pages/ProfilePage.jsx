import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Award,
  ChevronDown,
} from "lucide-react";

export function ProfilePage({ setActivePage }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Course Enrollments & Assessment Records State
  const [enrollments, setEnrollments] = useState([]);
  const [subjectMarks, setSubjectMarks] = useState([]);
  const [showAddMarkModal, setShowAddMarkModal] = useState(false);
  const [newMarkData, setNewMarkData] = useState({
    subject_code: "",
    subject_name: "",
    assessment_type: "Midterm Exam",
    obtained_score: 45.0,
    max_score: 50.0,
    weight_percentage: 20.0,
  });

  const [formData, setFormData] = useState({
    student_institutional_id: "",
    department: "CS",
    semester: "Year 2",
    institution: "MITAOE",
    degree_program: "Computer Engineering",
    admission_batch: "2023-2027",
    curriculum_version: "Autonomous 2022",
    age: 20,
    gender: "Female",
    family_income: 30000,
    internet_access: "Yes",
    study_hours_per_day: 3.5,
    attendance_rate: 85,
    assignment_delay_days: 1,
    travel_time_minutes: 25,
    part_time_job: "No",
    scholarship: "No",
    stress_index: 5.0,
    gpa: 7.2,
    semester_gpa: 7.0,
    cgpa: 7.2,
    parental_education: "Bachelor",
  });

  const fetchProfileAndCourses = async () => {
    try {
      setLoading(true);
      const [data, enrs, marks] = await Promise.all([
        api.profiles.getMyProfile().catch(() => null),
        api.curriculum.getMyEnrollments().catch(() => []),
        api.profiles.getMySubjectMarks().catch(() => []),
      ]);

      if (data) {
        setFormData({
          student_institutional_id: data.student_institutional_id || "",
          department: data.department || "CS",
          semester: data.semester || "Year 2",
          institution: data.institution || "MITAOE",
          degree_program: data.degree_program || "Computer Engineering",
          admission_batch: data.admission_batch || "2023-2027",
          curriculum_version: data.curriculum_version || "Autonomous 2022",
          age: data.age || 20,
          gender: data.gender || "Female",
          family_income: data.family_income ?? 30000,
          internet_access: data.internet_access || "Yes",
          study_hours_per_day: data.study_hours_per_day ?? 3.5,
          attendance_rate: data.attendance_rate ?? 85,
          assignment_delay_days: data.assignment_delay_days ?? 0,
          travel_time_minutes: data.travel_time_minutes ?? 25,
          part_time_job: data.part_time_job || "No",
          scholarship: data.scholarship || "No",
          stress_index: data.stress_index ?? 5.0,
          gpa: data.gpa ?? 7.2,
          semester_gpa: data.semester_gpa ?? 7.0,
          cgpa: data.cgpa ?? 7.2,
          parental_education: data.parental_education || "Bachelor",
        });
      }
      setEnrollments(enrs || []);
      setSubjectMarks(marks || []);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndCourses();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Validate bounds (10.0 scale)
      if (formData.gpa < 0 || formData.gpa > 10.0 || formData.semester_gpa < 0 || formData.semester_gpa > 10.0 || (formData.cgpa && (formData.cgpa < 0 || formData.cgpa > 10.0))) {
        throw new Error("GPA values must fall strictly within the 0.00 to 10.00 range.");
      }
      if (formData.attendance_rate < 0 || formData.attendance_rate > 100) {
        throw new Error("Attendance percentage must be between 0% and 100%.");
      }

      await api.profiles.updateMyProfile({
        department: formData.department,
        semester: formData.semester,
        institution: formData.institution || "MITAOE",
        degree_program: formData.degree_program || "Computer Engineering",
        admission_batch: formData.admission_batch || "2023-2027",
        curriculum_version: formData.curriculum_version || "Autonomous 2022",
        age: Number(formData.age),
        gender: formData.gender,
        family_income: Number(formData.family_income),
        internet_access: formData.internet_access,
        study_hours_per_day: Number(formData.study_hours_per_day),
        attendance_rate: Number(formData.attendance_rate),
        assignment_delay_days: Number(formData.assignment_delay_days),
        travel_time_minutes: Number(formData.travel_time_minutes),
        part_time_job: formData.part_time_job,
        scholarship: formData.scholarship,
        stress_index: Number(formData.stress_index),
        gpa: Number(formData.gpa),
        semester_gpa: Number(formData.semester_gpa),
        cgpa: Number(formData.cgpa),
        parental_education: formData.parental_education,
      });

      setSuccessMsg("Academic profile saved successfully! Your risk score and recovery plan have been automatically updated.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfidence = async (enrollmentId, newConfidence) => {
    try {
      await api.curriculum.updateEnrollment(enrollmentId, { confidence_level: newConfidence });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, confidence_level: newConfidence } : e))
      );
    } catch (err) {
      alert("Failed to update confidence: " + err.message);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!window.confirm("Remove this course from your active semester enrollment?")) return;
    try {
      await api.curriculum.deleteEnrollment(enrollmentId);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    } catch (err) {
      alert("Failed to remove course: " + err.message);
    }
  };

  const handleOpenAddMark = (course) => {
    setNewMarkData({
      subject_code: course.course_code,
      subject_name: course.course_title,
      assessment_type: "Midterm Exam",
      obtained_score: 45.0,
      max_score: 50.0,
      weight_percentage: 20.0,
    });
    setShowAddMarkModal(true);
  };

  const handleSaveNewMark = async (e) => {
    e.preventDefault();
    try {
      const added = await api.profiles.addSubjectMark({
        subject_code: newMarkData.subject_code,
        subject_name: newMarkData.subject_name,
        assessment_type: newMarkData.assessment_type,
        obtained_score: Number(newMarkData.obtained_score),
        max_score: Number(newMarkData.max_score),
        weight_percentage: Number(newMarkData.weight_percentage),
        topic_breakdown: [],
      });
      setSubjectMarks((prev) => [added, ...prev]);
      setShowAddMarkModal(false);
      setSuccessMsg(`Logged ${added.assessment_type} score (${added.obtained_score}/${added.max_score}) for ${added.subject_code}!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert("Failed to record score: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading profile form...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setActivePage("dashboard")}
          className="btn btn-sm btn-secondary"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <div className="card-header">
          <div>
            <span className="card-title">Academic Profile & Self-Service Records</span>
            <span className="card-subtitle">
              Verify your metrics to ensure the UDAAN ML early-warning system produces accurate, personalized guidance.
            </span>
          </div>
        </div>

        {successMsg && (
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-md)",
              background: "var(--risk-low-bg)",
              border: "1px solid var(--risk-low-border)",
              color: "var(--risk-low-text)",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-md)",
              background: "var(--risk-high-bg)",
              border: "1px solid var(--risk-high-border)",
              color: "var(--risk-high-text)",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* MITAOE Institutional Identification */}
          <div style={{ background: "var(--bg-subtle)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                  <GraduationCap size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                    MIT Academy of Engineering (MITAOE), Alandi, Pune
                  </span>
                </div>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  {formData.student_institutional_id || "Student Record"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                  <strong>Program:</strong> {formData.degree_program} | <strong>Batch:</strong> {formData.admission_batch} | <strong>Framework:</strong> {formData.curriculum_version}
                </div>
              </div>
              <span className="badge badge-accent" style={{ fontSize: "0.72rem" }}>
                Verified MITAOE Enrollment
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Curriculum aligned with MITAOE Autonomous course structure. Personal performance data remains strictly private.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Academic Track */}
            <div className="form-group">
              <label className="form-label" htmlFor="department">Department / Faculty</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-select"
              >
                <option value="CS">Computer Science (CS)</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Science">Natural Sciences</option>
                <option value="Arts">Humanities & Arts</option>
              </select>
              <span className="form-hint">Used for curriculum-specific timetable mapping</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="semester">Academic Level</label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Year 1">Year 1 (Freshman)</option>
                <option value="Year 2">Year 2 (Sophomore)</option>
                <option value="Year 3">Year 3 (Junior)</option>
                <option value="Year 4">Year 4 (Senior)</option>
              </select>
              <span className="form-hint">Current academic standing year</span>
            </div>

            {/* GPA Fields (0.00 - 10.00 Scale) */}
            <div className="form-group">
              <label className="form-label" htmlFor="gpa">Overall GPA (0.00 - 10.00)</label>
              <input
                id="gpa"
                name="gpa"
                type="number"
                step="0.01"
                min="0.0"
                max="10.0"
                required
                value={formData.gpa}
                onChange={handleChange}
                className="form-input"
              />
              <span className="form-hint">Cumulative overall GPA on 10-point scale</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="semester_gpa">Latest Semester GPA (0.00 - 10.00)</label>
              <input
                id="semester_gpa"
                name="semester_gpa"
                type="number"
                step="0.01"
                min="0.0"
                max="10.0"
                required
                value={formData.semester_gpa}
                onChange={handleChange}
                className="form-input"
              />
              <span className="form-hint">Term GPA from the most recent evaluation</span>
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label" htmlFor="cgpa">Current CGPA (0.00 - 10.00)</label>
              <input
                id="cgpa"
                name="cgpa"
                type="number"
                step="0.01"
                min="0.0"
                max="10.0"
                required
                value={formData.cgpa}
                onChange={handleChange}
                className="form-input"
              />
              <span className="form-hint">Verified official CGPA standing (out of 10.00)</span>
            </div>

            {/* Live GPA Threshold Segregation Banner */}
            {formData.cgpa !== "" && (
              <div
                style={{
                  gridColumn: "span 2",
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-md)",
                  background: Number(formData.cgpa) < 5.0 
                    ? "var(--risk-high-bg)" 
                    : Number(formData.cgpa) < 6.0 
                    ? "var(--risk-med-bg)" 
                    : "var(--risk-low-bg)",
                  border: `1px solid ${
                    Number(formData.cgpa) < 5.0 
                      ? "var(--risk-high-border)" 
                      : Number(formData.cgpa) < 6.0 
                      ? "var(--risk-med-border)" 
                      : "var(--risk-low-border)"
                  }`,
                  color: Number(formData.cgpa) < 5.0 
                    ? "var(--risk-high-text)" 
                    : Number(formData.cgpa) < 6.0 
                    ? "var(--risk-med-text)" 
                    : "var(--risk-low-text)",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem"
                }}
              >
                <div>
                  <strong>GPA Standing Tier: </strong>
                  {Number(formData.cgpa) >= 8.0 && "Distinction & Safe Standing (>= 8.0 / 10)"}
                  {Number(formData.cgpa) >= 6.0 && Number(formData.cgpa) < 8.0 && "Satisfactory Standing (6.0 - 7.9 / 10)"}
                  {Number(formData.cgpa) >= 5.0 && Number(formData.cgpa) < 6.0 && "Academic Warning (5.0 - 5.9 / 10, Below 6.0 Threshold)"}
                  {Number(formData.cgpa) < 5.0 && "Critical Academic Support Tier (< 5.0 / 10)"}
                </div>
                <div style={{ fontSize: "0.775rem", opacity: 0.9 }}>
                  {Number(formData.cgpa) < 6.0 ? "Triggers Targeted Academic Recovery Plan" : "Routine Academic Monitoring"}
                </div>
              </div>
            )}

            {/* Attendance & Study Habits */}
            <div className="form-group">
              <label className="form-label" htmlFor="attendance_rate">Attendance Rate (%)</label>
              <input
                id="attendance_rate"
                name="attendance_rate"
                type="number"
                step="0.1"
                min="0.0"
                max="100.0"
                required
                value={formData.attendance_rate}
                onChange={handleChange}
                className="form-input"
              />
              <span className="form-hint">Overall lecture and lab presence percentage</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="study_hours_per_day">Daily Study Hours (Hrs/Day)</label>
              <input
                id="study_hours_per_day"
                name="study_hours_per_day"
                type="number"
                step="0.1"
                min="0.0"
                max="20.0"
                required
                value={formData.study_hours_per_day}
                onChange={handleChange}
                className="form-input"
              />
              <span className="form-hint">Dedicated self-study time outside class</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="assignment_delay_days">Assignment Delays (Avg Days)</label>
              <input
                id="assignment_delay_days"
                name="assignment_delay_days"
                type="number"
                min="0"
                max="60"
                required
                value={formData.assignment_delay_days}
                onChange={handleChange}
                className="form-input"
              />
              <span className="form-hint">Average days past deadline for course submissions</span>
            </div>

            {/* Lifestyle & Wellness */}
            <div className="form-group">
              <label className="form-label" htmlFor="stress_index">Self-Reported Stress (1.0 - 10.0)</label>
              <input
                id="stress_index"
                name="stress_index"
                type="number"
                step="0.1"
                min="1.0"
                max="10.0"
                value={formData.stress_index}
                onChange={handleChange}
                className="form-input"
              />
              <span className="form-hint">1 = Calm, 10 = High academic/personal stress</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="travel_time_minutes">Commute Duration (Minutes)</label>
              <input
                id="travel_time_minutes"
                name="travel_time_minutes"
                type="number"
                min="0"
                max="240"
                value={formData.travel_time_minutes}
                onChange={handleChange}
                className="form-input"
              />
              <span className="form-hint">One-way transit time to campus</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="part_time_job">Part-Time Employment</label>
              <select
                id="part_time_job"
                name="part_time_job"
                value={formData.part_time_job}
                onChange={handleChange}
                className="form-select"
              >
                <option value="No">No (Full-time student)</option>
                <option value="Yes">Yes (Working while studying)</option>
              </select>
              <span className="form-hint">Assists in tailoring realistic schedule intervals</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="scholarship">Financial Scholarship</label>
              <select
                id="scholarship"
                name="scholarship"
                value={formData.scholarship}
                onChange={handleChange}
                className="form-select"
              >
                <option value="No">No</option>
                <option value="Yes">Yes (Scholarship recipient)</option>
              </select>
              <span className="form-hint">Indicates institutional scholarship status</span>
            </div>
          </div>

          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button
              type="button"
              onClick={() => setActivePage("dashboard")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ minWidth: "220px" }}
            >
              <Save size={16} />
              <span>{saving ? "Updating & Evaluating..." : "Save Profile & Refresh Score"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* MITAOE Verified Course Enrollments & Assessment Logger */}
      <div className="card" style={{ padding: "2rem", marginTop: "1.5rem" }}>
        <div className="card-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <BookOpen size={18} color="var(--accent-primary)" />
              <span className="card-title">MITAOE Enrolled Courses & Academic Assessments</span>
            </div>
            <span className="card-subtitle">
              Verified semester courses for {formData.degree_program}. Adjust your confidence ratings, note difficult concepts, and log test/quiz scores.
            </span>
          </div>
        </div>

        {enrollments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
            <p>No confirmed course enrollments recorded for this semester.</p>
            <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Use the onboarding wizard or contact your faculty advisor to register MITAOE semester courses.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {enrollments.map((course) => {
              const marksForCourse = subjectMarks.filter((m) => m.subject_code === course.course_code);
              return (
                <div
                  key={course.id}
                  style={{
                    padding: "1.25rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent-primary)", fontSize: "1rem" }}>
                          {course.course_code}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{course.course_title}</span>
                        <span className="badge badge-subtle" style={{ fontSize: "0.7rem" }}>
                          {course.enrollment_type || "Core"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        Semester {course.semester} | Target Goal: <strong>{course.academic_goal || "Pass with Distinction"}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenAddMark(course)}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <Award size={13} />
                        <span>Log Test Mark</span>
                      </button>

                      {course.enrollment_type === "Elective" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEnrollment(course.id)}
                          className="btn btn-sm btn-secondary"
                          style={{ color: "var(--risk-high-accent)" }}
                          title="Drop Elective"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Confidence & Difficult Topics Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "1rem", alignItems: "center", backgroundColor: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Confidence:</span>
                      <select
                        value={course.confidence_level || "Medium"}
                        onChange={(e) => handleUpdateConfidence(course.id, e.target.value)}
                        className="form-select"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", width: "auto" }}
                      >
                        <option value="High">High Confidence</option>
                        <option value="Medium">Medium Confidence</option>
                        <option value="Low">Low (Needs Tutoring)</option>
                      </select>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <strong>Difficult Topics:</strong>{" "}
                      {course.difficult_topics && course.difficult_topics.length > 0 ? (
                        course.difficult_topics.map((t, tidx) => (
                          <span key={tidx} className="badge badge-neutral" style={{ fontSize: "0.68rem", marginRight: "0.3rem" }}>
                            {t}
                          </span>
                        ))
                      ) : (
                        <span>None recorded — good mastery reported</span>
                      )}
                    </div>
                  </div>

                  {/* Recorded Assessment Marks for this Course */}
                  {marksForCourse.length > 0 && (
                    <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border-subtle)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                        Recorded Assessment Scores ({marksForCourse.length}):
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {marksForCourse.map((m) => {
                          const pct = m.max_score > 0 ? (m.obtained_score / m.max_score) * 100 : 0;
                          return (
                            <div
                              key={m.id}
                              style={{
                                padding: "0.35rem 0.65rem",
                                borderRadius: "var(--radius-sm)",
                                backgroundColor: pct < 60 ? "rgba(239, 68, 68, 0.1)" : "rgba(45, 106, 79, 0.1)",
                                border: `1px solid ${pct < 60 ? "var(--risk-high-border)" : "var(--risk-low-border)"}`,
                                fontSize: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{m.assessment_type}:</span>
                              <strong>{m.obtained_score} / {m.max_score}</strong>
                              <span style={{ opacity: 0.8 }}>({pct.toFixed(0)}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Assessment Mark Modal */}
      {showAddMarkModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div className="card" style={{ maxWidth: "460px", width: "100%", padding: "1.75rem" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.25rem" }}>
              Log Subject Assessment Score
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              {newMarkData.subject_code}: {newMarkData.subject_name}
            </div>

            <form onSubmit={handleSaveNewMark} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div className="form-group">
                <label className="form-label">Assessment Type *</label>
                <select
                  value={newMarkData.assessment_type}
                  onChange={(e) => setNewMarkData((p) => ({ ...p, assessment_type: e.target.value }))}
                  className="form-select"
                >
                  <option value="Midterm Exam">Midterm Exam (In-Sem)</option>
                  <option value="Quiz">Continuous Assessment Quiz</option>
                  <option value="Lab Practical">Laboratory / Practical Evaluation</option>
                  <option value="Assignment">Course Assignment Submission</option>
                  <option value="End-term Exam">End-Semester Examination</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">Score Achieved *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={newMarkData.obtained_score}
                    onChange={(e) => setNewMarkData((p) => ({ ...p, obtained_score: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Maximum Score *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    value={newMarkData.max_score}
                    onChange={(e) => setNewMarkData((p) => ({ ...p, max_score: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Grade Weightage (%)</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={newMarkData.weight_percentage}
                  onChange={(e) => setNewMarkData((p) => ({ ...p, weight_percentage: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddMarkModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
