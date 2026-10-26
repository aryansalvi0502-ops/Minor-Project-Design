import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Calendar,
  HeartHandshake,
  TrendingUp,
} from "lucide-react";

export function TopPrioritizedActions({ setActivePage, onActionTriggered }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedActions, setCompletedActions] = useState({});

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.recovery.getPrioritizedActions();
      setData(res);
    } catch (err) {
      console.warn("Could not load prioritized actions:", err);
      setError("Actions temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.action_target === "timetable") {
      if (onActionTriggered) onActionTriggered("timetable");
      else setActivePage("recovery-plan");
    } else if (action.action_target === "resources") {
      if (onActionTriggered) onActionTriggered("resources");
      else setActivePage("recovery-plan");
    } else if (action.action_target === "support") {
      setActivePage("support");
    } else if (action.action_target === "recovery") {
      setActivePage("recovery-plan");
    } else {
      setActivePage("dashboard");
    }
  };

  const toggleCompleted = (actionId) => {
    setCompletedActions((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        Loading prioritized next actions...
      </div>
    );
  }

  if (error || !data || !data.actions || data.actions.length === 0) {
    return null;
  }

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) {
      return {
        background: "rgba(239, 68, 68, 0.12)",
        color: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      };
    } else if (rank === 2) {
      return {
        background: "rgba(245, 158, 11, 0.12)",
        color: "#d97706",
        border: "1px solid rgba(245, 158, 11, 0.3)",
      };
    } else {
      return {
        background: "rgba(99, 102, 241, 0.12)",
        color: "#6366f1",
        border: "1px solid rgba(99, 102, 241, 0.3)",
      };
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "academic":
        return <BookOpen size={16} color="var(--accent-primary)" />;
      case "attendance":
      case "assignment":
        return <Clock size={16} color="#d97706" />;
      case "advisor":
      case "wellness":
        return <HeartHandshake size={16} color="#6366f1" />;
      default:
        return <Sparkles size={16} color="var(--accent-primary)" />;
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: "1.75rem",
        background: "linear-gradient(to right, var(--bg-surface), var(--bg-subtle))",
        borderLeft: "4px solid var(--accent-primary)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Top 3 Prioritized Next Actions
            </h2>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Dynamically prioritized based on your actual subject marks, attendance metrics, and upcoming deadlines.
          </p>
        </div>

        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Updated {new Date(data.last_evaluated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.25rem" }}>
        {data.actions.map((act) => {
          const isDone = completedActions[act.id] || act.is_completed;
          return (
            <div
              key={act.id}
              style={{
                background: isDone ? "var(--bg-subtle)" : "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1rem",
                position: "relative",
                transition: "all var(--transition-fast)",
                opacity: isDone ? 0.75 : 1.0,
              }}
            >
              <div>
                {/* Header with Rank & Category */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span
                    style={{
                      ...getRankBadgeStyle(act.rank),
                      padding: "0.2rem 0.55rem",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>#{act.rank}</span>
                    <span>{act.badge}</span>
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                    {getCategoryIcon(act.category)}
                    <span>{act.category}</span>
                  </div>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: isDone ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: isDone ? "line-through" : "none",
                    lineHeight: 1.4,
                    marginBottom: "0.5rem",
                  }}
                >
                  {act.title}
                </h3>

                {/* Rationale */}
                <div
                  style={{
                    fontSize: "0.825rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    background: "var(--bg-subtle)",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    borderLeft: "3px solid var(--border-subtle)",
                  }}
                >
                  <strong style={{ color: "var(--text-primary)", fontSize: "0.775rem", display: "block", marginBottom: "0.2rem" }}>
                    Why this matters:
                  </strong>
                  {act.rationale}
                </div>
              </div>

              {/* Action Button & Completion Checkbox */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleCompleted(act.id)}
                    style={{ accentColor: "var(--accent-primary)", width: "15px", height: "15px" }}
                  />
                  <span>Done</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleActionClick(act)}
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <span>{act.cta_text}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
