import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { RiskBadge } from "./RiskBadge";

export function RiskTrendChart() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.predictions.getTrends();
      setTrends(res);
      if (res.history_timeline && res.history_timeline.length > 0) {
        setSelectedPoint(res.history_timeline[0]);
      }
    } catch (err) {
      console.warn("Could not load prediction trends:", err);
      setError("Prediction trends will become available after additional evaluation snapshots.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "1.75rem", textAlign: "center", color: "var(--text-muted)" }}>
        Calculating comparable prediction trajectories...
      </div>
    );
  }

  if (error || !trends) {
    return null;
  }

  const getDirectionBadge = () => {
    if (trends.direction === "Improving") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.3rem 0.75rem",
            background: "rgba(16, 185, 129, 0.12)",
            color: "#10b981",
            borderRadius: "var(--radius-pill)",
            fontSize: "0.8rem",
            fontWeight: 800,
          }}
        >
          <TrendingDown size={16} />
          <span>Improving Trajectory ({trends.velocity_label})</span>
        </span>
      );
    } else if (trends.direction === "Deteriorating") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.3rem 0.75rem",
            background: "rgba(239, 68, 68, 0.12)",
            color: "#ef4444",
            borderRadius: "var(--radius-pill)",
            fontSize: "0.8rem",
            fontWeight: 800,
          }}
        >
          <TrendingUp size={16} />
          <span>Elevated Risk Trajectory ({trends.velocity_label})</span>
        </span>
      );
    } else {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.3rem 0.75rem",
            background: "rgba(99, 102, 241, 0.12)",
            color: "#6366f1",
            borderRadius: "var(--radius-pill)",
            fontSize: "0.8rem",
            fontWeight: 800,
          }}
        >
          <Minus size={16} />
          <span>{trends.direction} ({trends.velocity_label})</span>
        </span>
      );
    }
  };

  // Generate SVG Points for Timeline
  const timeline = [...(trends.history_timeline || [])].reverse(); // chronological (oldest to newest)
  const svgWidth = 600;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 30;

  const points = timeline.map((item, idx) => {
    const x =
      timeline.length === 1
        ? svgWidth / 2
        : paddingX + (idx / (timeline.length - 1)) * (svgWidth - 2 * paddingX);
    // Invert y: 0 risk is bottom (height - padding), 100 risk is top (padding)
    const y = svgHeight - paddingY - (item.risk_score / 100) * (svgHeight - 2 * paddingY);
    return { ...item, x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={18} color="var(--accent-primary)" />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Risk-Score History & Trend Detection
            </h2>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Tracking shifts across comparable prediction evaluations with attribution to academic improvements.
          </p>
        </div>

        {getDirectionBadge()}
      </div>

      {/* Narrative Attribution Box */}
      <div
        style={{
          padding: "0.85rem 1.1rem",
          background: "var(--bg-subtle)",
          borderLeft: "4px solid var(--accent-primary)",
          borderRadius: "var(--radius-md)",
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          marginBottom: "1.5rem",
        }}
      >
        <strong style={{ color: "var(--text-primary)" }}>Trajectory Diagnosis: </strong>
        {trends.trend_narrative}
      </div>

      {/* SVG Sparkline & Timeline */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          <span>Risk Score History (0 - 100 Scale)</span>
          <span>{trends.total_evaluations} Evaluations Recorded</span>
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "180px", overflow: "visible" }}>
            {/* Horizontal guideline thresholds */}
            <line x1={paddingX} y1={svgHeight - paddingY - 0.3 * (svgHeight - 2 * paddingY)} x2={svgWidth - paddingX} y2={svgHeight - paddingY - 0.3 * (svgHeight - 2 * paddingY)} stroke="var(--border-subtle)" strokeDasharray="4 4" />
            <line x1={paddingX} y1={svgHeight - paddingY - 0.6 * (svgHeight - 2 * paddingY)} x2={svgWidth - paddingX} y2={svgHeight - paddingY - 0.6 * (svgHeight - 2 * paddingY)} stroke="var(--border-subtle)" strokeDasharray="4 4" />

            {/* Threshold Labels */}
            <text x={svgWidth - paddingX + 5} y={svgHeight - paddingY - 0.3 * (svgHeight - 2 * paddingY) + 3} fontSize="10" fill="var(--text-muted)">30 (Med)</text>
            <text x={svgWidth - paddingX + 5} y={svgHeight - paddingY - 0.6 * (svgHeight - 2 * paddingY) + 3} fontSize="10" fill="var(--text-muted)">60 (High)</text>

            {/* Connecting curve line */}
            {points.length > 1 && (
              <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Interactive Data Points */}
            {points.map((pt) => {
              const isSelected = selectedPoint && selectedPoint.id === pt.id;
              const circleColor = pt.risk_score >= 60 ? "#ef4444" : pt.risk_score >= 30 ? "#f59e0b" : "#10b981";
              return (
                <g key={pt.id} onClick={() => setSelectedPoint(pt)} style={{ cursor: "pointer" }}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 7 : 5}
                    fill={circleColor}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--text-primary)"
                  >
                    {pt.risk_score.toFixed(0)}
                  </text>
                  <text
                    x={pt.x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-muted)"
                  >
                    {new Date(pt.prediction_timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Snapshot Inspector */}
        {selectedPoint && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem 1rem",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.85rem",
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)" }}>Snapshot evaluated: </span>
              <strong>{new Date(selectedPoint.prediction_timestamp).toLocaleString()}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span>Probability: <strong>{(selectedPoint.dropout_probability * 100).toFixed(1)}%</strong></span>
              <RiskBadge category={selectedPoint.risk_category} score={selectedPoint.risk_score} />
            </div>
          </div>
        )}
      </div>

      {/* Factor Shifts Attribution List */}
      {trends.factor_shifts && trends.factor_shifts.length > 0 && (
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.6rem" }}>
            Indicator Factor Shifts Driving Trajectory
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
            {trends.factor_shifts.map((shift, idx) => {
              const isGood = shift.impact === "decreases_risk";
              return (
                <div
                  key={idx}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderLeft: `4px solid ${isGood ? "#10b981" : "#ef4444"}`,
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.825rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{shift.label}</span>
                    <span style={{ fontWeight: 800, color: isGood ? "#10b981" : "#ef4444" }}>
                      {shift.delta > 0 ? `+${shift.delta}` : shift.delta}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-secondary)", lineHeight: 1.4, fontSize: "0.775rem" }}>
                    {shift.narrative}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
