import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { TimetableCalendar } from "../components/TimetableCalendar";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  ListTodo,
  BookOpen,
} from "lucide-react";

export function RecoveryPlanPage({ setActivePage }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await api.recovery.getActivePlan();
      setPlan(data);
    } catch (err) {
      setError(err.message || "Failed to load active recovery plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const updated = await api.recovery.toggleTask(taskId, !currentStatus);
      setPlan(updated);
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading your personalized recovery plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container" style={{ maxWidth: "600px", margin: "3rem auto" }}>
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <AlertCircle size={36} color="var(--risk-medium-accent)" style={{ margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>No Active Recovery Plan</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0.75rem 0 1.5rem" }}>
            A personalized recovery plan is generated automatically when your profile is saved and evaluated.
          </p>
          <button onClick={() => setActivePage("profile")} className="btn btn-primary" style={{ margin: "0 auto" }}>
            <span>Complete Academic Profile</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <button
            onClick={() => setActivePage("dashboard")}
            className="btn btn-sm btn-secondary"
            style={{ marginBottom: "0.5rem" }}
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {plan.title}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Structured, adaptable milestones formulated from your verified performance indicators.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Plan Completion
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)" }}>
              {plan.completion_rate.toFixed(0)}%
            </div>
          </div>
          <span className="badge badge-low" style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>
            {plan.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="progress-track" style={{ height: "10px" }}>
        <div className="progress-fill" style={{ width: `${plan.completion_rate}%` }} />
      </div>

      {/* Identified Improvement Areas & Recommended Actions */}
      <div className="grid-cols-12">
        <div className="col-span-6 card">
          <div className="card-header">
            <span className="card-title">Identified Focus Areas</span>
            <Target size={18} color="var(--accent-primary)" />
          </div>
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {plan.identified_areas.map((area, idx) => (
              <li key={idx} style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
                {area}
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-6 card">
          <div className="card-header">
            <span className="card-title">Recommended Practical Strategies</span>
            <Sparkles size={18} color="var(--accent-primary)" />
          </div>
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {plan.recommended_actions.map((act, idx) => (
              <li key={idx} style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {act}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Weekly Milestone Goals */}
      {plan.weekly_goals && plan.weekly_goals.length > 0 && (
        <div className="grid-cols-12">
          <div className="col-span-12 card">
            <div className="card-header">
              <span className="card-title">Weekly Structured Targets</span>
              <span className="card-subtitle">Achievable short-term academic benchmarks</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {plan.weekly_goals.map((g, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span className="badge badge-neutral" style={{ fontSize: "0.7rem" }}>Week {g.week}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-primary)" }}>{g.focus_area}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                    {g.target}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Success metric: <strong>{g.metric}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Recovery Tasks & Schedule */}
      <div className="grid-cols-12">
        {/* Checklist */}
        <div className="col-span-6 card">
          <div className="card-header">
            <span className="card-title">Action Items & Reminders</span>
            <span className="card-subtitle">Check items as you complete them</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {plan.tasks.map((task) => (
              <label
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.85rem",
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
                  style={{ marginTop: "4px", width: 17, height: 17, accentColor: "var(--accent-primary)" }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: task.is_completed ? "var(--text-muted)" : "var(--text-primary)",
                      textDecoration: task.is_completed ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                      {task.description}
                    </div>
                  )}
                  {task.target_date && (
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Clock size={12} />
                      <span>Target: {new Date(task.target_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Timetable Schedule */}
        <div className="col-span-6 card">
          <div className="card-header">
            <span className="card-title">Curriculum Study Timetable</span>
            <span className="card-subtitle">Customizable weekly schedule template</span>
          </div>

          <TimetableCalendar timetable={plan.suggested_timetable} />
        </div>
      </div>

      {/* Ethical Disclaimer */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <HelpCircle size={20} style={{ flexShrink: 0 }} />
        <span>
          <strong>Supportive Guarantee Policy:</strong> This recovery plan is an adaptable roadmap to facilitate your success. It does not promise guaranteed grades or retention outcomes, nor is it ever used to penalize students. You can adjust your plan at any time in consultation with your academic advisor.
        </span>
      </div>
    </div>
  );
}
