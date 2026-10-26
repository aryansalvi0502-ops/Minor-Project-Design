import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { RiskBadge } from "./RiskBadge";
import {
  Sliders,
  Sparkles,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  ShieldAlert,
  Info,
  Clock,
  BookOpen,
  Calendar,
  Zap,
} from "lucide-react";

export function WhatIfSimulator({ profile, currentPrediction, onSaveGoals }) {
  // Extract initial baseline values strictly from student's profile
  const getInitialParams = (prof) => ({
    gpa: Number.isFinite(Number(prof?.cgpa)) ? Number(prof.cgpa) : 7.0,
    study_hours_per_day: Number.isFinite(Number(prof?.study_hours_per_day)) ? Number(prof.study_hours_per_day) : 2.5,
    attendance_rate: Number.isFinite(Number(prof?.attendance_rate)) ? Number(prof.attendance_rate) : 75.0,
    assignment_delay_days: Number.isFinite(Number(prof?.assignment_delay_days)) ? Number(prof.assignment_delay_days) : 1,
    stress_index: Number.isFinite(Number(prof?.stress_index)) ? Number(prof.stress_index) : 5.0,
  });

  const [params, setParams] = useState(() => getInitialParams(profile));
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");

  // Sync params when profile changes
  useEffect(() => {
    if (profile) {
      setParams(getInitialParams(profile));
    }
  }, [profile]);

  const runSimulation = async (updatedParams) => {
    const raw = updatedParams || params;
    // Strict numeric boundary validation
    const payload = {
      gpa: Math.min(10.0, Math.max(0.0, Number(raw.gpa) || 0.0)),
      study_hours_per_day: Math.min(16.0, Math.max(0.0, Number(raw.study_hours_per_day) || 0.0)),
      attendance_rate: Math.min(100.0, Math.max(0.0, Number(raw.attendance_rate) || 0.0)),
      assignment_delay_days: Math.min(30, Math.max(0, parseInt(raw.assignment_delay_days) || 0)),
      stress_index: Math.min(10.0, Math.max(1.0, Number(raw.stress_index) || 5.0)),
    };

    try {
      setSimulating(true);
      setError("");
      const res = await api.predictions.simulateWhatIf(payload);
      setSimResult(res);
    } catch (err) {
      console.error("Simulation request error:", err);
      setError(err.message || "Model simulation unavailable. Please check your connectivity.");
    } finally {
      setSimulating(false);
    }
  };

  // Run initial simulation once on mount or when profile is ready
  useEffect(() => {
    if (profile) {
      runSimulation();
    }
  }, [profile]);

  const handleChange = (field, value) => {
    const num = parseFloat(value);
    const validNum = Number.isFinite(num) ? num : 0;
    const next = { ...params, [field]: validNum };
    setParams(next);
    runSimulation(next);
  };

  const handleReset = () => {
    if (!profile) return;
    const initial = getInitialParams(profile);
    setParams(initial);
    runSimulation(initial);
  };

  // Safe score and probability extraction (handles both field styles and protects against NaN)
  const baselineScore = Number.isFinite(Number(currentPrediction?.risk_score))
    ? Number(currentPrediction.risk_score)
    : Number.isFinite(Number(simResult?.baseline_risk_score))
    ? Number(simResult.baseline_risk_score)
    : 50.0;

  const simulatedScore = Number.isFinite(Number(simResult?.simulated_risk_score))
    ? Number(simResult.simulated_risk_score)
    : Number.isFinite(Number(simResult?.risk_score))
    ? Number(simResult.risk_score)
    : baselineScore;

  const simulatedCategory = simResult?.simulated_risk_category || simResult?.risk_category || currentPrediction?.risk_category || "Low";

  const simulatedProb = Number.isFinite(Number(simResult?.simulated_dropout_probability))
    ? Number(simResult.simulated_dropout_probability)
    : Number.isFinite(Number(simResult?.dropout_probability))
    ? Number(simResult.dropout_probability)
    : (currentPrediction?.dropout_probability ?? 0.2);

  const deltaScore = Number.isFinite(simulatedScore) && Number.isFinite(baselineScore)
    ? Math.round((simulatedScore - baselineScore) * 10) / 10
    : 0;

  // Sensitivity drivers normalization (objects vs strings)
  const rawDrivers = simResult?.top_sensitivity_drivers || simResult?.sensitivity_drivers || [];
  const normalizedDrivers = rawDrivers.map((d) => {
    if (typeof d === "string") return d;
    if (d && typeof d === "object") {
      return `${d.parameter || "Factor"}: ${d.change || ""}`;
    }
    return String(d);
  });

  return (
    <div
      className="card"
      style={{
        padding: "1.75rem",
        borderLeft: "4px solid var(--accent-primary)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sliders size={20} color="var(--accent-primary)" />
            <span className="card-title" style={{ fontSize: "1.15rem", fontWeight: 800 }}>
              What-If Academic Simulator
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-subtle)",
                color: "var(--accent-primary)",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Hypothetical Model Analysis
            </span>
          </div>
          <p className="card-subtitle" style={{ marginTop: "0.25rem", maxWidth: "660px" }}>
            Interactively explore how hypothetical improvements in your GPA, daily self-study, class attendance, turnaround speed, and stress level alter the calibrated machine learning early-warning risk estimate.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={handleReset}
            className="btn btn-secondary btn-sm"
            title="Reset all inputs back to your actual saved student profile"
          >
            <RefreshCw size={14} className={simulating ? "spin" : ""} />
            <span>Reset to Profile</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "var(--risk-high-accent)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Simulator Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* Controls Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* GPA Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                Target Cumulative GPA (10.0 Scale)
              </label>
              <span style={{ fontWeight: 800, color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>
                {Number(params.gpa || 0).toFixed(2)} / 10.0
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="10.0"
              step="0.1"
              value={params.gpa}
              onChange={(e) => handleChange("gpa", e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.725rem", color: "var(--text-muted)" }}>
              <span>0.0 (Critical)</span>
              <span>5.0 (Warning)</span>
              <span>6.0 (Safe Threshold)</span>
              <span>8.0 (Honors)</span>
              <span>10.0</span>
            </div>
          </div>

          {/* Daily Study Hours Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                Daily Self-Study Commitment
              </label>
              <span style={{ fontWeight: 800, color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>
                {Number(params.study_hours_per_day || 0).toFixed(1)} hrs/day
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="12.0"
              step="0.5"
              value={params.study_hours_per_day}
              onChange={(e) => handleChange("study_hours_per_day", e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.725rem", color: "var(--text-muted)" }}>
              <span>0h (Passive)</span>
              <span>2.5h (Average)</span>
              <span>5h (Intensive)</span>
              <span>12h (Max)</span>
            </div>
          </div>

          {/* Class Attendance Rate Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                Class Attendance Rate
              </label>
              <span style={{ fontWeight: 800, color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>
                {Math.round(params.attendance_rate || 0)}%
              </span>
            </div>
            <input
              type="range"
              min="40.0"
              max="100.0"
              step="1.0"
              value={params.attendance_rate}
              onChange={(e) => handleChange("attendance_rate", e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.725rem", color: "var(--text-muted)" }}>
              <span>40% (Debarred)</span>
              <span>75% (Mandatory Min)</span>
              <span>90% (Consistent)</span>
              <span>100%</span>
            </div>
          </div>

          {/* Assignment Delay & Stress Sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                  Submission Delay
                </label>
                <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem" }}>
                  {Math.round(params.assignment_delay_days || 0)}d
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={params.assignment_delay_days}
                onChange={(e) => handleChange("assignment_delay_days", e.target.value)}
                style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>0 = On time, 7+ = Critical</span>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                  Academic Stress
                </label>
                <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem" }}>
                  {Math.round(params.stress_index || 0)} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={params.stress_index}
                onChange={(e) => handleChange("stress_index", e.target.value)}
                style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>1 = Calm, 10 = Overloaded</span>
            </div>
          </div>
        </div>

        {/* Results & Comparison Column */}
        <div
          style={{
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)" }}>
              Hypothetical Model Output
            </span>
            <RiskBadge category={simulatedCategory} score={simulatedScore} />
          </div>

          {/* Scores Comparison Banner */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              background: "var(--bg-surface)",
              padding: "1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Baseline Official Score</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "var(--font-mono)" }}>
                {Math.round(baselineScore)}
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>/100</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Category: <strong>{currentPrediction?.risk_category || "N/A"}</strong>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Simulated Result</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--accent-primary)" }}>
                {Math.round(simulatedScore)}
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>/100</span>
              </div>
              <div style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                {deltaScore < 0 ? (
                  <span style={{ color: "var(--risk-low-accent)", fontWeight: 700, display: "flex", alignItems: "center" }}>
                    <TrendingDown size={14} /> {Math.abs(deltaScore).toFixed(1)} pts lower risk
                  </span>
                ) : deltaScore > 0 ? (
                  <span style={{ color: "var(--risk-high-accent)", fontWeight: 700, display: "flex", alignItems: "center" }}>
                    <TrendingUp size={14} /> +{deltaScore.toFixed(1)} pts higher risk
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>No net change</span>
                )}
              </div>
            </div>
          </div>

          {/* Estimated Dropout Probability */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", background: "var(--bg-surface)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Model Discontinuation Probability:</span>
            <span style={{ fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              {(simulatedProb * 100).toFixed(1)}%
            </span>
          </div>

          {/* Primary Drivers Detected */}
          {normalizedDrivers.length > 0 && (
            <div>
              <div style={{ fontSize: "0.775rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Leading Scenario Sensitivity Drivers
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {normalizedDrivers.map((drv, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Zap size={13} color="var(--accent-primary)" />
                    <span>{drv}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Non-Guarantee Disclaimer */}
          <div
            style={{
              padding: "0.75rem 0.85rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              lineHeight: 1.45,
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}
          >
            <ShieldAlert size={16} color="var(--risk-med-accent)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>Hypothetical Non-Guarantee Notice:</strong> {simResult?.ethical_disclaimer || "Simulated results represent statistical approximations evaluated against the calibrated model. They demonstrate sensitivity to study habits and do not guarantee official exam grades or retention outcomes. Practical recovery is guided with your faculty mentor."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
