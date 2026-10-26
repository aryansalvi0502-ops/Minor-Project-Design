import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api, normalizeLearningGaps } from "../services/api";
import { RiskBadge } from "../components/RiskBadge";
import { FeatureContributionChart } from "../components/FeatureContributionChart";
import { Modal } from "../components/Modal";
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  UserCheck,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  Shield,
  Clock,
  Sparkles,
  Star,
  MessageSquare,
  ThumbsUp,
  MapPin,
  Video,
  Phone,
  Check,
  ListTodo,
} from "lucide-react";

export function AdvisorDashboard({ setActivePage }) {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackSummary, setFeedbackSummary] = useState(null);

  // Filters and sorting
  const [search, setSearch] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");
  const [selectedGpaTier, setSelectedGpaTier] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSem, setSelectedSem] = useState("");
  const [sortBy, setSortBy] = useState("risk_score");
  const [sortOrder, setSortOrder] = useState("desc");

  // Inspection modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [studentPrediction, setStudentPrediction] = useState(null);
  const [studentInterventions, setStudentInterventions] = useState([]);
  const [studentGaps, setStudentGaps] = useState([]);
  const [studentGapReport, setStudentGapReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [gapsLoading, setGapsLoading] = useState(false);
  const [gapsError, setGapsError] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState("overview"); // "overview" | "gaps" | "interventions"

  // Appointment Action Modal State
  const [actionModalInv, setActionModalInv] = useState(null);
  const [actionType, setActionType] = useState("confirm"); // "confirm" | "complete"
  const [confirmForm, setConfirmForm] = useState({
    meeting_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    modality: "Video Call",
    meeting_link_or_location: "Google Meet: https://meet.google.com/adv-conf",
    advisor_notes: "",
  });
  const [completeForm, setCompleteForm] = useState({
    follow_up_notes: "",
    follow_up_tasks: "Revise Chapter 3 Practice Problems; submit draft by Thursday",
  });
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Intervention note form in modal
  const [interventionType, setInterventionType] = useState("Academic Tutoring & Study Strategy");
  const [meetingDate, setMeetingDate] = useState("");
  const [advisorNotes, setAdvisorNotes] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [interventionSubmitting, setInterventionSubmitting] = useState(false);
  const [interventionSuccess, setInterventionSuccess] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const [cohortData, fbData] = await Promise.all([
        api.advisor.getAssignedStudents({
          search,
          risk_category: selectedRisk,
          gpa_tier: selectedGpaTier,
          department: selectedDept,
          semester: selectedSem,
          sort_by: sortBy,
          sort_order: sortOrder,
        }),
        api.advisor.getFeedbackSummary().catch(() => null),
      ]);
      setStudents((cohortData || []).filter(Boolean));
      if (fbData) setFeedbackSummary(fbData);
    } catch (err) {
      setError(err.message || "Failed to load assigned students cohort.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedRisk, selectedDept, selectedSem, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStudents();
  };

  const handleCloseStudentDetail = () => {
    setSelectedStudent(null);
    setStudentDetail(null);
    setStudentPrediction(null);
    setStudentInterventions([]);
    setStudentGaps([]);
    setStudentGapReport(null);
    setGapsError("");
    setActiveDetailTab("overview");
  };

  const handleOpenStudentDetail = async (student) => {
    if (!student) return;
    setSelectedStudent(student);
    setDetailLoading(true);
    setGapsLoading(true);
    setGapsError("");
    setInterventionSuccess("");
    setAdvisorNotes("");
    setActionTaken("");
    setActiveDetailTab("overview");
    try {
      const [prof, pred, intervs, gaps] = await Promise.all([
        api.profiles.getProfileById(student.student_profile_id),
        api.predictions.getStudentPrediction(student.student_profile_id).catch(() => null),
        api.advisor.listInterventions(student.student_profile_id).catch(() => []),
        api.advisor.getStudentLearningGaps(student.student_profile_id).catch((err) => {
          console.warn("Learning gaps load failed:", err);
          setGapsError(err.message || "Failed to load learning gap report.");
          return null;
        }),
      ]);
      setStudentDetail(prof);
      setStudentPrediction(pred);
      setStudentInterventions(Array.isArray(intervs) ? intervs : []);
      setStudentGapReport(gaps && typeof gaps === "object" ? gaps : null);
      setStudentGaps(normalizeLearningGaps(gaps));
    } catch (err) {
      console.error("Failed to load student detail:", err);
    } finally {
      setDetailLoading(false);
      setGapsLoading(false);
    }
  };

  const handleReloadGaps = async () => {
    if (!selectedStudent?.student_profile_id) return;
    try {
      setGapsLoading(true);
      setGapsError("");
      const gaps = await api.advisor.getStudentLearningGaps(selectedStudent.student_profile_id);
      setStudentGapReport(gaps && typeof gaps === "object" ? gaps : null);
      setStudentGaps(normalizeLearningGaps(gaps));
    } catch (err) {
      setGapsError(err.message || "Failed to reload learning gap report.");
    } finally {
      setGapsLoading(false);
    }
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!actionModalInv) return;
    try {
      setActionSubmitting(true);
      await api.advisor.confirmAppointment(actionModalInv.id, {
        meeting_date: new Date(confirmForm.meeting_date).toISOString(),
        modality: confirmForm.modality,
        meeting_link_or_location: confirmForm.meeting_link_or_location,
        advisor_notes: confirmForm.advisor_notes,
      });
      setActionModalInv(null);
      // Reload interventions
      if (selectedStudent) {
        const updated = await api.advisor.listInterventions(selectedStudent.student_profile_id);
        setStudentInterventions(updated || []);
      }
      loadStudents();
    } catch (err) {
      alert("Failed to confirm appointment: " + err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!actionModalInv) return;
    try {
      setActionSubmitting(true);
      await api.advisor.completeAppointment(actionModalInv.id, {
        follow_up_notes: completeForm.follow_up_notes,
        follow_up_tasks: completeForm.follow_up_tasks,
      });
      setActionModalInv(null);
      // Reload interventions
      if (selectedStudent) {
        const updated = await api.advisor.listInterventions(selectedStudent.student_profile_id);
        setStudentInterventions(updated || []);
      }
      loadStudents();
    } catch (err) {
      alert("Failed to complete appointment: " + err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRecordIntervention = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setInterventionSubmitting(true);
    try {
      await api.advisor.createIntervention({
        student_id: selectedStudent.student_profile_id,
        intervention_type: interventionType,
        meeting_date: meetingDate ? new Date(meetingDate).toISOString() : null,
        advisor_notes: advisorNotes || null,
        action_taken: actionTaken || "Advisor Review & Goal Setting",
      });
      setInterventionSuccess("Intervention recorded and scheduled. Confidential notes archived in audit trail.");
      const updated = await api.advisor.listInterventions(selectedStudent.student_profile_id).catch(() => []);
      setStudentInterventions(updated || []);
      setAdvisorNotes("");
      setActionTaken("");
      loadStudents();
      setTimeout(() => {
        setInterventionSuccess("");
      }, 3000);
    } catch (err) {
      alert("Failed to save intervention: " + err.message);
    } finally {
      setInterventionSubmitting(false);
    }
  };

  // Cohort summary statistics
  const totalCohort = students.length;
  const highRiskCount = students.filter((s) => s.risk_category === "High").length;
  const medRiskCount = students.filter((s) => s.risk_category === "Medium").length;
  const lowRiskCount = students.filter((s) => s.risk_category === "Low").length;
  const pendingRequests = students.filter((s) => s.intervention_status === "requested_by_student").length;

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>UDAAN • Faculty Advisor Console</span>
            {user?.department && (
              <span className="badge badge-neutral" style={{ fontSize: "0.7rem", textTransform: "none", padding: "0.1rem 0.4rem" }}>
                {user.department}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.25rem" }}>
            {user?.full_name ? `Welcome, ${user.full_name}` : "Assigned Student Cohort"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            Monitor UDAAN early-warning risk scores, evaluate subject learning gaps, and coordinate human guidance interventions.
          </p>
          {!authLoading && !user && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Profile information unavailable.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setActivePage("model-card")} className="btn btn-secondary btn-sm">
            <Shield size={14} />
            <span>Model Card</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--risk-high-accent)", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Cohort KPI Summary Cards & Student Feedback */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Total Assigned Cohort
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.25rem" }}>{totalCohort}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Active advisees</div>
        </div>

        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--risk-high-accent)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--risk-high-accent)", textTransform: "uppercase", fontWeight: 700 }}>
            Priority Support (High)
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.25rem", color: "var(--risk-high-accent)" }}>
            {highRiskCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Early intervention required</div>
        </div>

        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--risk-med-accent)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--risk-med-accent)", textTransform: "uppercase", fontWeight: 700 }}>
            Targeted Monitoring (Med)
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.25rem", color: "var(--risk-med-accent)" }}>
            {medRiskCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Academic warning track</div>
        </div>

        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--risk-low-accent)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--risk-low-accent)", textTransform: "uppercase", fontWeight: 700 }}>
            Routine Monitoring (Low)
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.25rem", color: "var(--risk-low-accent)" }}>
            {lowRiskCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Good standing</div>
        </div>

        {/* Feature 9: Student Feedback Metric Card */}
        {feedbackSummary && (
          <div className="card" style={{ padding: "1.25rem", background: "linear-gradient(135deg, var(--bg-surface), var(--bg-subtle))" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", textTransform: "uppercase", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <Star size={13} fill="var(--accent-primary)" /> Support Rating
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.25rem", color: "var(--accent-primary)" }}>
              {feedbackSummary.average_rating ? feedbackSummary.average_rating.toFixed(1) : "5.0"}
              <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>/5</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {feedbackSummary.helpful_percentage}% found guidance helpful ({feedbackSummary.total_feedbacks} reviews)
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: "1rem" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <input
              type="text"
              placeholder="Search by student name or institutional ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "2.25rem" }}
            />
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>

          <div style={{ minWidth: "150px" }}>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="form-select"
            >
              <option value="">All Risk Tiers</option>
              <option value="High">Priority Support (High)</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          <div style={{ minWidth: "170px" }}>
            <select
              value={selectedGpaTier}
              onChange={(e) => setSelectedGpaTier(e.target.value)}
              className="form-select"
            >
              <option value="">All GPA Standings</option>
              <option value="below_threshold">Below Threshold (&lt; 6.0/10)</option>
              <option value="critical">Critical Concern (&lt; 5.0/10)</option>
              <option value="average">Satisfactory (6.0 - 7.9/10)</option>
              <option value="high">Distinction (&gt;= 8.0/10)</option>
            </select>
          </div>

          <div style={{ minWidth: "150px" }}>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="form-select"
            >
              <option value="risk_score-desc">Risk: High to Low</option>
              <option value="risk_score-asc">Risk: Low to High</option>
              <option value="attendance_rate-asc">Attendance: Lowest First</option>
              <option value="gpa-asc">GPA: Lowest First</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: "0.625rem 1rem" }}>
            Apply Filter
          </button>
        </form>
      </div>

      {/* Cohort Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student & Institutional ID</th>
              <th>Department / Level</th>
              <th>Cumulative GPA</th>
              <th>Attendance</th>
              <th>Risk Assessment</th>
              <th>Active Plan Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem" }}>
                  Loading cohort records...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  No students matched your search criteria.
                </td>
              </tr>
            ) : (
              students.filter(Boolean).map((s) => (
                <tr key={s.student_profile_id}>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{s?.full_name || "Profile unavailable"}</div>
                    <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {s?.student_institutional_id || "ID unavailable"} • {s?.email || "Email unavailable"}
                    </div>
                  </td>
                  <td>
                    <div>{s?.department || "Department unavailable"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s?.semester || ""}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {s?.cgpa != null ? s.cgpa.toFixed(2) : "N/A"} <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 10</span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: (s?.cgpa ?? 10) < 5.0 ? "var(--risk-high-accent)" : (s?.cgpa ?? 10) < 6.0 ? "var(--risk-med-accent)" : "var(--accent-primary)" }}>
                      {(s?.cgpa ?? 10) < 5.0 ? "Critical (<5.0)" : (s?.cgpa ?? 10) < 6.0 ? "Below Threshold (<6.0)" : "Good Standing"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s?.attendance_rate != null ? `${s.attendance_rate.toFixed(1)}%` : "N/A"}</div>
                    <div style={{ fontSize: "0.7rem", color: (s?.attendance_rate ?? 100) < 75 ? "var(--risk-high-accent)" : "var(--accent-primary)" }}>
                      {(s?.attendance_rate ?? 100) < 75 ? "Below threshold" : "Regular"}
                    </div>
                  </td>
                  <td>
                    <RiskBadge category={s?.risk_category || "Unassessed"} score={s?.risk_score} />
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span className="badge badge-low" style={{ fontSize: "0.7rem" }}>
                        {s?.plan_completion_rate ? `${s.plan_completion_rate.toFixed(0)}% Complete` : "Plan Active"}
                      </span>
                      {s?.intervention_status === "requested_by_student" && (
                        <span
                          className="badge"
                          style={{
                            fontSize: "0.7rem",
                            background: "rgba(220, 38, 38, 0.15)",
                            color: "#DC2626",
                            border: "1px solid rgba(220, 38, 38, 0.3)",
                            fontWeight: 700,
                          }}
                        >
                          Help Requested
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleOpenStudentDetail(s)}
                      className="btn btn-sm btn-secondary"
                      style={{ display: "inline-flex", gap: "0.3rem" }}
                    >
                      <Eye size={14} />
                      <span>Review Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Student Details & SHAP Inspection Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={handleCloseStudentDetail}
          title={`Student Case Review: ${selectedStudent?.full_name || "Student"}`}
          maxWidth="820px"
        >
          {detailLoading ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
              Loading student explanation and case details...
            </div>
          ) : (selectedStudent && studentDetail) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Identity & Current Score Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    {studentDetail?.department || "General"} • {studentDetail?.semester || "Current"}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>
                    {selectedStudent?.full_name || studentDetail?.full_name || "Student Case"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Institutional ID: {studentDetail?.student_institutional_id || "N/A"} | Email: {selectedStudent?.email || studentDetail?.email || "N/A"}
                  </div>
                </div>

                {studentPrediction && (
                  <div style={{ textAlign: "right" }}>
                    <RiskBadge category={studentPrediction.risk_category} score={studentPrediction.risk_score} />
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      Probability: {(studentPrediction.dropout_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

            {/* Modal Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
              <button
                onClick={() => setActiveDetailTab("overview")}
                className={`btn btn-sm ${activeDetailTab === "overview" ? "btn-primary" : "btn-secondary"}`}
              >
                Overview & SHAP
              </button>
              <button
                onClick={() => setActiveDetailTab("gaps")}
                className={`btn btn-sm ${activeDetailTab === "gaps" ? "btn-primary" : "btn-secondary"}`}
              >
                Subject Learning Gaps ({Array.isArray(studentGaps) ? studentGaps.length : 0})
              </button>
              <button
                onClick={() => setActiveDetailTab("interventions")}
                className={`btn btn-sm ${activeDetailTab === "interventions" ? "btn-primary" : "btn-secondary"}`}
              >
                Appointments & Notes ({Array.isArray(studentInterventions) ? studentInterventions.length : 0})
              </button>
            </div>

            {/* TAB 1: Overview & SHAP */}
            {activeDetailTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Academic Snapshot */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", textAlign: "center" }}>
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "0.6rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Cumulative GPA</div>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{studentDetail?.cgpa != null ? studentDetail.cgpa.toFixed(2) : "N/A"}</div>
                  </div>
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "0.6rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Attendance</div>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{studentDetail?.attendance_rate != null ? `${studentDetail.attendance_rate.toFixed(1)}%` : "N/A"}</div>
                  </div>
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "0.6rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Daily Study Hours</div>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{studentDetail?.study_hours_per_day != null ? `${studentDetail.study_hours_per_day}h` : "N/A"}</div>
                  </div>
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: "0.6rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Assignment Delays</div>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{studentDetail?.assignment_delay_days != null ? `${studentDetail.assignment_delay_days} days` : "N/A"}</div>
                  </div>
                </div>

                {/* SHAP Explanation */}
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Sparkles size={16} color="var(--accent-primary)" />
                    <span>Explainable AI Risk Factor Decomposition</span>
                  </h4>
                  {studentPrediction?.explanation ? (
                    <FeatureContributionChart
                      contributions={studentPrediction.explanation.feature_contributions}
                      maxItems={5}
                    />
                  ) : (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No explanation available for this student.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Diagnosed Subject Learning Gaps */}
            {activeDetailTab === "gaps" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    Actual subject-level marks and diagnostic gaps evaluated against academic mastery thresholds.
                  </p>
                  {studentGapReport?.overall_academic_average != null && (
                    <div style={{ fontSize: "0.775rem", background: "var(--bg-subtle)", padding: "0.25rem 0.6rem", borderRadius: "var(--radius-sm)" }}>
                      Cohort Academic Avg: <strong>{studentGapReport.overall_academic_average.toFixed(1)}%</strong> ({studentGapReport.total_assessments_recorded || 0} assessments)
                    </div>
                  )}
                </div>

                {gapsLoading ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Diagnosing subject learning gaps...
                  </div>
                ) : gapsError ? (
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "var(--risk-high-accent)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span>{gapsError}</span>
                    <button onClick={handleReloadGaps} className="btn btn-sm btn-outline">
                      Retry
                    </button>
                  </div>
                ) : !Array.isArray(studentGaps) || studentGaps.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No critical learning gaps identified for this student.
                  </div>
                ) : (
                  studentGaps.map((gap, i) => {
                    const subName = gap.subject_name || "Course Subject";
                    const subCode = gap.subject_code || "";
                    const concept = gap.concept_area || gap.topic || "Core Syllabus Topic";
                    const score = gap.average_percentage ?? gap.average_score;
                    const scoreStr = typeof score === "number" ? `${score.toFixed(1)}%` : "Under Evaluation";
                    const severity = gap.gap_severity || gap.severity || "Needs Attention";
                    const recommendation = gap.remediation_recommendation || gap.recommended_action || "Schedule a 1-on-1 tutoring session to review fundamentals.";

                    return (
                      <div
                        key={gap.id || i}
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "rgba(239, 68, 68, 0.04)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderLeft: "4px solid var(--risk-high-accent)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                              {subName} {subCode ? `(${subCode})` : ""}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--risk-high-accent)", fontWeight: 600, marginTop: "2px" }}>
                              Weak Concept: {concept} (Score: {scoreStr})
                            </div>
                          </div>
                          <span className="badge badge-high" style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                            {severity}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
                          <strong>Remediation Recommendation:</strong> {recommendation}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: Interventions & Appointments */}
            {activeDetailTab === "interventions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Active Consultations & Requests */}
                {studentInterventions.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No consultations recorded yet for this student.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "240px", overflowY: "auto" }}>
                    {studentInterventions.map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          background: inv.status === "requested_by_student" ? "rgba(220, 38, 38, 0.06)" : "var(--bg-surface)",
                          border: `1px solid ${inv.status === "requested_by_student" ? "rgba(220, 38, 38, 0.3)" : "var(--border-subtle)"}`,
                          borderRadius: "var(--radius-md)",
                          padding: "0.75rem 1rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                          <div>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{inv.intervention_type}</span>
                            {inv.urgency && (
                              <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", fontWeight: 700, color: inv.urgency === "Immediate" ? "#DC2626" : "var(--text-muted)" }}>
                                • Urgency: {inv.urgency}
                              </span>
                            )}
                            {inv.modality && (
                              <span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                ({inv.modality})
                              </span>
                            )}
                          </div>

                          <span
                            className="badge"
                            style={{
                              fontSize: "0.65rem",
                              background:
                                inv.status === "completed"
                                  ? "var(--risk-low-bg)"
                                  : inv.status === "requested_by_student"
                                  ? "rgba(220, 38, 38, 0.15)"
                                  : "var(--bg-subtle)",
                              color:
                                inv.status === "completed"
                                  ? "var(--risk-low-text)"
                                  : inv.status === "requested_by_student"
                                  ? "#DC2626"
                                  : "var(--text-secondary)",
                            }}
                          >
                            {inv.status === "requested_by_student" ? "Requested by Student" : inv.status}
                          </span>
                        </div>

                        {inv.student_request_notes && (
                          <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontStyle: "italic", marginBottom: "0.3rem" }}>
                            Student Note: "{inv.student_request_notes}"
                          </div>
                        )}
                        {inv.meeting_link_or_location && (
                          <div style={{ color: "var(--accent-primary)", fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                            Location/Link: {inv.meeting_link_or_location}
                          </div>
                        )}
                        {inv.follow_up_tasks && (
                          <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                            Follow-Up Tasks: <strong>{inv.follow_up_tasks}</strong>
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.4rem", marginTop: "0.4rem" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {inv.meeting_date ? `Meeting: ${new Date(inv.meeting_date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : `Logged: ${new Date(inv.created_at).toLocaleDateString()}`}
                          </span>

                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            {inv.status === "requested_by_student" && (
                              <button
                                onClick={() => {
                                  setActionModalInv(inv);
                                  setActionType("confirm");
                                }}
                                className="btn btn-sm btn-primary"
                                style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}
                              >
                                Confirm Meeting
                              </button>
                            )}
                            {inv.status !== "completed" && (
                              <button
                                onClick={() => {
                                  setActionModalInv(inv);
                                  setActionType("complete");
                                }}
                                className="btn btn-sm btn-secondary"
                                style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}
                              >
                                Complete & Add Follow-Up
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Record New Intervention Form */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    Record New Consultation Note
                  </div>

                  {interventionSuccess && (
                    <div style={{ padding: "0.6rem 0.85rem", background: "var(--risk-low-bg)", color: "var(--risk-low-text)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <CheckCircle size={15} />
                      <span>{interventionSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleRecordIntervention}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <div>
                        <label className="form-label" style={{ fontSize: "0.8rem" }}>Support Action Type</label>
                        <select
                          value={interventionType}
                          onChange={(e) => setInterventionType(e.target.value)}
                          className="form-select"
                        >
                          <option value="Academic Tutoring & Study Strategy">Academic Tutoring</option>
                          <option value="Attendance Recovery Counseling">Attendance Counseling</option>
                          <option value="Mental Health / Wellbeing Referral">Wellbeing Referral</option>
                          <option value="Workload Balancing">Workload Balancing</option>
                          <option value="Financial Aid Guidance">Financial Aid Guidance</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: "0.8rem" }}>Follow-up Meeting Date</label>
                        <input
                          type="datetime-local"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>
                        Staff-Only Confidential Notes (Not visible to student)
                      </label>
                      <textarea
                        rows={2}
                        value={advisorNotes}
                        onChange={(e) => setAdvisorNotes(e.target.value)}
                        placeholder="Enter confidential observation, root causes discussed, and follow-up milestones..."
                        className="form-textarea"
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="submit"
                        disabled={interventionSubmitting}
                        className="btn btn-sm btn-primary"
                      >
                        <span>{interventionSubmitting ? "Saving..." : "Record Support Action"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
            Student profile information unavailable or failed to load.
          </div>
        )}
      </Modal>
    )}

      {/* Appointment Action Modal (Confirm / Complete) */}
      {actionModalInv && (
        <Modal
          isOpen={!!actionModalInv}
          onClose={() => setActionModalInv(null)}
          title={actionType === "confirm" ? "Confirm Student Consultation Request" : "Complete Consultation & Assign Follow-Up"}
        >
          {actionType === "confirm" ? (
            <form onSubmit={handleConfirmSubmit}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Confirm scheduled date and consultation modality for <strong>{actionModalInv.intervention_type}</strong>.
              </p>

              <div className="form-group">
                <label className="form-label">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={confirmForm.meeting_date}
                  onChange={(e) => setConfirmForm({ ...confirmForm, meeting_date: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Modality</label>
                <select
                  value={confirmForm.modality}
                  onChange={(e) => setConfirmForm({ ...confirmForm, modality: e.target.value })}
                  className="form-select"
                >
                  <option value="In-Person">In-Person Office Visit</option>
                  <option value="Video Call">Secure Video Call</option>
                  <option value="Chat">Text / Chat Discussion</option>
                  <option value="Phone">Phone Call</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Meeting Room / Video Link</label>
                <input
                  type="text"
                  value={confirmForm.meeting_link_or_location}
                  onChange={(e) => setConfirmForm({ ...confirmForm, meeting_link_or_location: e.target.value })}
                  placeholder="e.g. Faculty Room 304 or https://meet.google.com/..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Note for Student (Optional)</label>
                <textarea
                  rows={2}
                  value={confirmForm.advisor_notes}
                  onChange={(e) => setConfirmForm({ ...confirmForm, advisor_notes: e.target.value })}
                  placeholder="e.g. Please bring your Midterm exam papers..."
                  className="form-textarea"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setActionModalInv(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={actionSubmitting} className="btn btn-primary">
                  <span>{actionSubmitting ? "Confirming..." : "Confirm & Notify Student"}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCompleteSubmit}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Log completion notes and assign actionable follow-up tasks to the student's recovery plan.
              </p>

              <div className="form-group">
                <label className="form-label">Consultation Outcomes & Follow-Up Tasks</label>
                <textarea
                  rows={3}
                  required
                  value={completeForm.follow_up_tasks}
                  onChange={(e) => setCompleteForm({ ...completeForm, follow_up_tasks: e.target.value })}
                  placeholder="e.g. Complete Dynamic Programming practice exercises; attend tutoring session on Thursday..."
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confidential Advisor Follow-Up Notes</label>
                <textarea
                  rows={2}
                  value={completeForm.follow_up_notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, follow_up_notes: e.target.value })}
                  placeholder="Confidential observations on student progress..."
                  className="form-textarea"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setActionModalInv(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={actionSubmitting} className="btn btn-primary">
                  <span>{actionSubmitting ? "Saving..." : "Mark Completed"}</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
