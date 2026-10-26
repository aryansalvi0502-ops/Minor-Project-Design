import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
} from "lucide-react";
import { Modal } from "./Modal";

export function LearningGapsCard({ onSelectResourceQuery }) {
  const [gapReport, setGapReport] = useState(null);
  const [marksList, setMarksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubject, setExpandedSubject] = useState(null);

  // New Assessment Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [subCode, setSubCode] = useState("CS201");
  const [subName, setSubName] = useState("Data Structures & Algorithms");
  const [assessmentType, setAssessmentType] = useState("Midterm Exam");
  const [obtainedScore, setObtainedScore] = useState(65);
  const [maxScore, setMaxScore] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    loadLearningGaps();
  }, []);

  const loadLearningGaps = async () => {
    try {
      setLoading(true);
      setError("");
      const [report, marks] = await Promise.all([
        api.profiles.getMyLearningGaps().catch(() => null),
        api.profiles.getMySubjectMarks().catch(() => []),
      ]);
      setGapReport(report);
      setMarksList(marks || []);
    } catch (err) {
      console.warn("Could not load learning gaps:", err);
      setError("Learning-gap analysis temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssessment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess("");
    try {
      await api.profiles.addSubjectMark({
        subject_code: subCode,
        subject_name: subName,
        assessment_type: assessmentType,
        obtained_score: Number(obtainedScore),
        max_score: Number(maxScore),
        weight_percentage: 20.0,
      });
      setSubmitSuccess("Assessment recorded successfully! Gaps updated.");
      await loadLearningGaps();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSubmitSuccess("");
      }, 1500);
    } catch (err) {
      alert("Failed to record assessment: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Analyzing subject-level marks and diagnosing concept gaps...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--risk-high-accent)", marginBottom: "0.75rem", fontSize: "0.9rem" }}>{error}</p>
        <button onClick={loadLearningGaps} className="btn btn-sm btn-outline">Retry Analysis</button>
      </div>
    );
  }

  if (!gapReport) {
    return (
      <div className="card" style={{ padding: "1.75rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "0.75rem", fontSize: "0.9rem" }}>No learning-gap analysis records available yet.</p>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-sm btn-primary">Log First Assessment</button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "Mastered":
        return <span className="badge badge-low">Mastered (A)</span>;
      case "Satisfactory":
        return <span className="badge badge-low">Satisfactory (B)</span>;
      case "Needs Attention":
        return <span className="badge badge-med">Needs Attention (C)</span>;
      default:
        return <span className="badge badge-high">Critical Deficit (D/F)</span>;
    }
  };

  const getSeverityBadge = (sev) => {
    if (sev === "Critical Gap") {
      return (
        <span style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 700 }}>
          Critical Gap (&lt;50%)
        </span>
      );
    } else if (sev === "Moderate Deficit") {
      return (
        <span style={{ background: "rgba(245, 158, 11, 0.15)", color: "#d97706", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 700 }}>
          Moderate Deficit (50-60%)
        </span>
      );
    } else {
      return (
        <span style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 700 }}>
          Needs Reinforcement
        </span>
      );
    }
  };

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Layers size={18} color="var(--accent-primary)" />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Subject-Level Learning-Gap Analysis
            </h2>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Empirical diagnosis derived from {gapReport?.total_assessments_recorded || 0} recorded assessments, midterms, and lab practicals.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "var(--bg-subtle)", padding: "0.4rem 0.85rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>Academic Average:</span>
            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: (gapReport?.overall_academic_average || 0) < 65 ? "var(--risk-high-accent)" : "var(--accent-primary)" }}>
              {(gapReport?.overall_academic_average || 0).toFixed(1)}%
            </span>
          </div>

          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-sm btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <PlusCircle size={15} />
            <span>Log Assessment</span>
          </button>
        </div>
      </div>

      {/* Critical Concept Gaps Highlights */}
      {Array.isArray(gapReport?.critical_concept_gaps) && gapReport.critical_concept_gaps.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.6rem" }}>
            Identified Concept Deficits & Actionable Recommendations
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {(gapReport.critical_concept_gaps || []).map((gap, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: gap.severity === "Critical Gap" ? "4px solid #ef4444" : "4px solid #f59e0b",
                  borderRadius: "var(--radius-md)",
                  padding: "0.9rem 1.1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      {gap.topic || gap.concept_area}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      • {gap.subject_code} ({gap.subject_name})
                    </span>
                    {getSeverityBadge(gap.severity || gap.gap_severity)}
                  </div>
                  <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                    <strong>Recommended Action:</strong> {gap.recommended_action || gap.remediation_recommendation}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>
                    Avg: {(gap.average_score ?? gap.average_percentage ?? 0).toFixed(1)}%
                  </span>
                  {onSelectResourceQuery && (
                    <button
                      onClick={() => onSelectResourceQuery(gap.recommended_resource_query || `${gap.subject_code} ${gap.topic}`)}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                    >
                      Find Study Guides
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject-Wise Mastery Cards */}
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.6rem" }}>
        Course Mastery Breakdown
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        {(gapReport?.subjects_summary || []).map((sub) => {
          const isExpanded = expandedSubject === sub.subject_code;
          return (
            <div
              key={sub.subject_code}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "0.6rem",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    {sub.subject_code}
                  </span>
                  {getStatusBadge(sub.mastery_status)}
                </div>

                <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", height: "2.2rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {sub.subject_name}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "1.4rem", fontWeight: 900, fontFamily: "var(--font-mono)" }}>
                    {sub.overall_percentage.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>
                    {sub.assessment_count} assessments logged
                  </span>
                </div>

                {/* Mini Progress Bar */}
                <div className="progress-track" style={{ height: "5px", margin: "0.5rem 0" }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, sub.overall_percentage)}%`,
                      backgroundColor: sub.overall_percentage < 60 ? "var(--risk-high-accent)" : sub.overall_percentage < 75 ? "var(--risk-med-accent)" : "var(--accent-primary)",
                    }}
                  />
                </div>
              </div>

              {sub.weak_topics && sub.weak_topics.length > 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "0.35rem 0.55rem", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>Attention needed:</span> {sub.weak_topics.join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Log Assessment Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Log Course Assessment / Exam Score">
        {submitSuccess ? (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--accent-primary)" }}>
            <CheckCircle2 size={36} style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontWeight: 700 }}>{submitSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleAddAssessment}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Record your real quiz, assignment, or midterm marks to update your learning-gap diagnosis and model risk estimate.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input
                  type="text"
                  required
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  placeholder="e.g. CS201"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Data Structures"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assessment Type</label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="form-select"
              >
                <option value="Midterm Exam">Midterm Exam</option>
                <option value="Quiz / Class Test">Quiz / Class Test</option>
                <option value="Programming Assignment">Programming Assignment</option>
                <option value="Lab Practical">Lab Practical</option>
                <option value="End-term Final">End-term Final</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Score Achieved</label>
                <input
                  type="number"
                  min="0"
                  max={maxScore}
                  step="0.5"
                  required
                  value={obtainedScore}
                  onChange={(e) => setObtainedScore(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Maximum Possible</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? "Saving Mark..." : "Save Assessment"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
