import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { RiskBadge } from "../components/RiskBadge";
import { FeatureContributionChart } from "../components/FeatureContributionChart";
import { Modal } from "../components/Modal";
import { TopPrioritizedActions } from "../components/TopPrioritizedActions";
import { WhatIfSimulator } from "../components/WhatIfSimulator";
import { LearningGapsCard } from "../components/LearningGapsCard";
import { RiskTrendChart } from "../components/RiskTrendChart";
import { AdaptiveTimetable } from "../components/AdaptiveTimetable";
import { RemindersModal } from "../components/RemindersModal";
import { VerifiedResourcesModal } from "../components/VerifiedResourcesModal";
import { StudentOnboardingModal } from "../components/StudentOnboardingModal";
import {
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Edit,
  ArrowRight,
  TrendingDown,
  Award,
  Sliders,
  CheckCircle2,
  HeartHandshake,
  Bot,
  Bell,
  Flame,
  ShieldCheck,
  Compass,
} from "lucide-react";

export function StudentDashboard({ setActivePage }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [recoveryPlan, setRecoveryPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modals state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState(null);

  // Advisor meeting modal
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTopic, setMeetingTopic] = useState("Academic Tutoring & Study Strategy");
  const [meetingUrgency, setMeetingUrgency] = useState("Normal");
  const [meetingModality, setMeetingModality] = useState("In-Person");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingSuccessMsg, setMeetingSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Load Profile
      const profData = await api.profiles.getMyProfile().catch((err) => {
        if (err.message && (err.message.includes("404") || err.message.includes("onboarding"))) {
          return null;
        }
        throw err;
      });

      if (!profData) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(profData);

      // 2. Load Prediction & Explanation
      const predData = await api.predictions.getMyLatest().catch(() => null);
      setPrediction(predData);

      // 3. Load Active Recovery Plan
      const planData = await api.recovery.getActivePlan().catch(() => null);
      setRecoveryPlan(planData);

      // 4. Load Prediction History
      const histData = await api.predictions.getMyHistory().catch(() => []);
      setHistory(histData || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const prevBadges = recoveryPlan?.milestone_badges || [];
      const updatedPlan = await api.recovery.toggleTask(taskId, !currentStatus);
      setRecoveryPlan(updatedPlan);

      // Check if new milestone badge unlocked
      const newBadges = (updatedPlan?.milestone_badges || []).filter(
        (b) => !prevBadges.includes(b)
      );
      if (newBadges.length > 0) {
        setMilestoneCelebration(`Milestone Achieved! You unlocked the ${newBadges[0].replace(/_/g, " ")} badge!`);
        setTimeout(() => setMilestoneCelebration(null), 5000);
      }
    } catch (err) {
      console.error("Task update failed:", err);
    }
  };

  const handleRefreshPrediction = async () => {
    setRefreshing(true);
    try {
      await api.profiles.updateMyProfile({});
      await loadData();
    } catch (err) {
      setError("Prediction refresh failed: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequestMeeting = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setMeetingSubmitting(true);
    try {
      await api.advisor.createIntervention({
        student_id: profile.id,
        intervention_type: meetingTopic,
        urgency: meetingUrgency,
        modality: meetingModality,
        student_request_notes: meetingNotes,
      });
      setMeetingSuccessMsg("Your meeting request has been submitted to your academic advisor!");
      setTimeout(() => {
        setIsMeetingModalOpen(false);
        setMeetingSuccessMsg("");
        setMeetingNotes("");
      }, 2000);
    } catch (err) {
      alert("Failed to submit request: " + err.message);
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const handleActionSelected = (action) => {
    if (action.action_type === "meeting_request") {
      setIsMeetingModalOpen(true);
    } else if (action.action_type === "timetable") {
      const el = document.getElementById("timetable-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (action.action_type === "learning_gap") {
      setIsResourcesOpen(true);
    } else if (action.action_type === "recovery_plan") {
      setActivePage("recovery-plan");
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <div style={{ fontSize: "1.1rem", color: "var(--text-muted)" }}>
          Loading your student success insights...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container" style={{ maxWidth: "560px", margin: "3rem auto" }}>
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <Sparkles size={36} color="var(--accent-primary)" style={{ margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>Welcome to Your Student Hub!</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0.75rem 0 1.5rem", fontSize: "0.95rem" }}>
            To generate your explainable risk evaluation, customized recovery plan, and study timetable, please complete your academic profile.
          </p>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="btn btn-primary"
            style={{ margin: "0 auto" }}
          >
            <span>Start Guided Onboarding</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <StudentOnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onComplete={loadData}
        />
      </div>
    );
  }

  const badges = recoveryPlan?.milestone_badges || [];
  const streak = recoveryPlan?.streak_count || 0;

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Welcome & Overview Header */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          background: "linear-gradient(to right, var(--bg-surface), var(--bg-subtle))",
        }}
      >
        <div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            UDAAN • Student Success Early-Warning Overview
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.2rem" }}>
            Welcome back, {user?.full_name || "Student"}!
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.4rem", fontSize: "0.85rem", color: "var(--text-secondary)", flexWrap: "wrap" }}>
            <span>ID: <strong>{profile.student_institutional_id}</strong></span>
            <span>•</span>
            <span>{profile.department}</span>
            <span>•</span>
            <span>{profile.semester}</span>
            {streak > 0 && (
              <>
                <span>•</span>
                <span style={{ color: "var(--risk-med-accent)", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                  <Flame size={15} /> {streak}-Day Study Streak
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsResourcesOpen(true)}
            className="btn btn-secondary btn-sm"
          >
            <BookOpen size={15} />
            <span>Learning Resources</span>
          </button>

          <button
            onClick={() => setIsRemindersOpen(true)}
            className="btn btn-secondary btn-sm"
          >
            <Bell size={15} />
            <span>Reminders & Alerts</span>
          </button>

          <button
            onClick={() => setIsMeetingModalOpen(true)}
            className="btn btn-outline btn-sm"
          >
            <MessageSquare size={15} />
            <span>Request Advisor Check-In</span>
          </button>

          <button
            onClick={handleRefreshPrediction}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
            title="Re-run model evaluation with latest records"
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Evaluating..." : "Refresh Score"}</span>
          </button>

          <button
            onClick={() => setActivePage("profile")}
            className="btn btn-secondary btn-sm"
          >
            <Edit size={14} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Milestone Celebration Banner */}
      {milestoneCelebration && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            backgroundColor: "rgba(99, 102, 241, 0.12)",
            border: "1px solid var(--accent-primary)",
            borderRadius: "var(--radius-md)",
            color: "var(--accent-primary)",
            fontWeight: 700,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <Award size={20} />
          <span>{milestoneCelebration}</span>
        </div>
      )}

      {/* Feature 1: Top 3 Prioritized Next Actions */}
      <TopPrioritizedActions onActionClicked={handleActionSelected} />

      {/* Main Stats Row */}
      <div className="grid-cols-12">
        {/* Risk Score Card */}
        <div className="col-span-4 card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="card-header">
            <span className="card-title">UDAAN Early-Warning Assessment</span>
            {prediction && (
              <RiskBadge category={prediction.risk_category} score={prediction.risk_score} />
            )}
          </div>

          <div style={{ padding: "0.75rem 0", textAlign: "center" }}>
            <div style={{ fontSize: "3.25rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {prediction ? prediction.risk_score.toFixed(0) : "--"}
              <span style={{ fontSize: "1.25rem", color: "var(--text-muted)", fontWeight: 500 }}>/100</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
              Estimated Discontinuation Risk Score
            </div>
          </div>

          <div
            style={{
              padding: "0.65rem 0.85rem",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.775rem",
              color: "var(--text-muted)",
              lineHeight: 1.4,
            }}
          >
            {prediction?.disclaimer || "Probabilistic estimate based on observational academic trends."}
          </div>
        </div>

        {/* Academic Standings KPI */}
        <div className="col-span-8 card">
          <div className="card-header">
            <span className="card-title">Verified Academic Performance</span>
            <span className="card-subtitle">Updated {new Date(profile.last_profile_update).toLocaleDateString()}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Cumulative GPA
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.2rem" }}>
                {profile.cgpa.toFixed(2)} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 10</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: profile.cgpa < 5.0 ? "var(--risk-high-accent)" : profile.cgpa < 6.0 ? "var(--risk-med-accent)" : "var(--accent-primary)" }}>
                {profile.cgpa < 5.0 ? "Critical Academic Support" : profile.cgpa < 6.0 ? "Academic Warning (< 6.0 Threshold)" : "Good Standing (>= 6.0)"}
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Semester GPA
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.2rem" }}>
                {profile.semester_gpa.toFixed(2)} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 10</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Recent term
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Attendance Rate
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.2rem" }}>
                {profile.attendance_rate.toFixed(1)}%
              </div>
              <div style={{ fontSize: "0.75rem", color: profile.attendance_rate < 75.0 ? "var(--risk-high-accent)" : "var(--accent-primary)" }}>
                {profile.attendance_rate < 75.0 ? "Below target" : "Attending regularly"}
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Study Commitment
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.2rem" }}>
                {profile.study_hours_per_day ? `${profile.study_hours_per_day}h` : "N/A"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Self-study / day
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 5: Multi-Factor What-If Academic Simulator */}
      <div className="grid-cols-12">
        <div className="col-span-12">
          <WhatIfSimulator
            profile={profile}
            currentPrediction={prediction}
            onSaveGoals={loadData}
          />
        </div>
      </div>

      {/* Feature 3 & 4: Learning-Gaps Analysis & Risk Trend Detection */}
      <div className="grid-cols-12">
        <div className="col-span-6">
          <LearningGapsCard onMarksUpdated={loadData} />
        </div>
        <div className="col-span-6">
          <RiskTrendChart />
        </div>
      </div>

      {/* Feature 6: Recovery Milestones & Feature 2: Adaptive Timetable */}
      <div className="grid-cols-12">
        {/* Recovery Checklist & Milestone Badges */}
        <div className="col-span-6 card">
          <div className="card-header">
            <div>
              <span className="card-title">Personalized Recovery Milestones</span>
              <span className="card-subtitle">
                {recoveryPlan?.title || "Active Academic Support Plan"}
              </span>
            </div>
            {recoveryPlan && (
              <span className="badge badge-low" style={{ fontSize: "0.75rem" }}>
                {recoveryPlan.completion_rate.toFixed(0)}% Completed
              </span>
            )}
          </div>

          {recoveryPlan ? (
            <div>
              {/* Progress Bar */}
              <div className="progress-track" style={{ marginBottom: "1rem" }}>
                <div
                  className="progress-fill"
                  style={{ width: `${recoveryPlan.completion_rate}%` }}
                />
              </div>

              {/* Milestone Badges & Streak Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "1rem",
                  fontSize: "0.8rem",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Award size={16} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 700 }}>Milestone Badges:</span>
                  {badges.length === 0 ? (
                    <span style={{ color: "var(--text-muted)" }}>Complete 25% to earn your first badge!</span>
                  ) : (
                    badges.map((b) => (
                      <span
                        key={b}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(99, 102, 241, 0.15)",
                          color: "var(--accent-primary)",
                        }}
                      >
                        {b.replace(/_/g, " ")}
                      </span>
                    ))
                  )}
                </div>

                {streak > 0 && (
                  <span style={{ color: "var(--risk-med-accent)", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                    <Flame size={14} /> {streak}d Streak
                  </span>
                )}
              </div>

              {/* Tasks List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {recoveryPlan.tasks.map((task) => (
                  <label
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      background: task.is_completed ? "var(--bg-subtle)" : "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => handleToggleTask(task.id, task.is_completed)}
                      style={{ marginTop: "3px", width: 16, height: 16, accentColor: "var(--accent-primary)" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          color: task.is_completed ? "var(--text-muted)" : "var(--text-primary)",
                          textDecoration: task.is_completed ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                          {task.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ marginTop: "1rem", textAlign: "right" }}>
                <button onClick={() => setActivePage("recovery-plan")} className="btn btn-sm btn-outline">
                  <span>View Full Schedule & Goals</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
              No active recovery plan found. Update your profile to generate recommendations.
            </div>
          )}
        </div>

        {/* SHAP Explanation Section */}
        <div className="col-span-6 card">
          <div className="card-header">
            <div>
              <span className="card-title">AI Explainability Factors</span>
              <p className="card-subtitle">
                SHAP decomposition showing what influences your predicted outcome.
              </p>
            </div>
          </div>

          {prediction?.explanation ? (
            <FeatureContributionChart
              contributions={prediction.explanation.feature_contributions}
            />
          ) : (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
              Explanations will appear once your prediction evaluation runs.
            </div>
          )}
        </div>
      </div>

      {/* Feature 2: Adaptive Study Timetable */}
      <div id="timetable-section" className="grid-cols-12">
        <div className="col-span-12">
          <AdaptiveTimetable onTimetableUpdated={loadData} />
        </div>
      </div>

      {/* Prediction History Timeline */}
      {history.length > 1 && (
        <div className="grid-cols-12">
          <div className="col-span-12 card">
            <div className="card-header">
              <span className="card-title">Prediction & Progress History</span>
              <span className="card-subtitle">Tracking change in risk indicators over successive profile evaluations</span>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Evaluation Date</th>
                    <th>Risk Score</th>
                    <th>Category</th>
                    <th>Dropout Probability</th>
                    <th>Model Version</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{new Date(h.prediction_timestamp).toLocaleDateString()} {new Date(h.prediction_timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td style={{ fontWeight: 700 }}>{h.risk_score.toFixed(1)}/100</td>
                      <td>
                        <RiskBadge category={h.risk_category} score={h.risk_score} showScore={false} />
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{(h.dropout_probability * 100).toFixed(1)}%</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>{h.model_version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
      />

      <VerifiedResourcesModal
        isOpen={isResourcesOpen}
        onClose={() => setIsResourcesOpen(false)}
      />

      {/* Advisor Meeting Modal (Feature 10) */}
      <Modal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        title="Schedule Academic Advisor Consultation"
      >
        {meetingSuccessMsg ? (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--accent-primary)" }}>
            <CheckCircle size={36} style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontWeight: 700 }}>{meetingSuccessMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleRequestMeeting}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Request a confidential consultation with your assigned faculty advisor to discuss academic barriers, workload adjustment, or study strategies.
            </p>

            <div className="form-group">
              <label className="form-label">Consultation Focus</label>
              <select
                value={meetingTopic}
                onChange={(e) => setMeetingTopic(e.target.value)}
                className="form-select"
              >
                <option value="Academic Tutoring & Study Strategy">Academic Tutoring & Study Strategy</option>
                <option value="Attendance Recovery Counseling">Attendance Recovery Counseling</option>
                <option value="Assignment Turnaround & Time Management">Assignment Turnaround & Time Management</option>
                <option value="Stress & Workload Balancing">Stress & Workload Balancing</option>
                <option value="Financial & Scholarship Guidance">Financial & Scholarship Guidance</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Urgency Level</label>
                <select
                  value={meetingUrgency}
                  onChange={(e) => setMeetingUrgency(e.target.value)}
                  className="form-select"
                >
                  <option value="Normal">Normal (Within 5 days)</option>
                  <option value="High">High (Within 48 hours)</option>
                  <option value="Immediate">Immediate (Within 24 hours)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Modality</label>
                <select
                  value={meetingModality}
                  onChange={(e) => setMeetingModality(e.target.value)}
                  className="form-select"
                >
                  <option value="In-Person">In-Person Office Visit</option>
                  <option value="Video Call">Secure Video Call</option>
                  <option value="Chat">Text / Chat Discussion</option>
                  <option value="Phone">Phone Call</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes for Advisor (Optional)</label>
              <textarea
                rows={3}
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Share any specific course or personal circumstance you would like assistance with..."
                className="form-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button
                type="button"
                onClick={() => setIsMeetingModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={meetingSubmitting}
                className="btn btn-primary"
              >
                <span>{meetingSubmitting ? "Submitting..." : "Send Request"}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
