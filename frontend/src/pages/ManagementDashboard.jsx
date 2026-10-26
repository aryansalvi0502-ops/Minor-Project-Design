import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  ShieldCheck,
  Building,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export function ManagementDashboard({ setActivePage }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const data = await api.analytics.getOverview();
        setAnalytics(data);
      } catch (err) {
        setError(err.message || "Failed to load management analytics.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!analytics) return;
    const rows = [
      ["Metric Type", "Category", "Total Students", "Avg Risk Score", "High Risk Count", "High Risk %"],
    ];

    analytics.department_breakdown.forEach((d) => {
      rows.push(["Department", d.department, d.total_students, d.avg_risk_score, d.high_risk_count, `${d.high_risk_pct}%`]);
    });

    analytics.semester_breakdown.forEach((s) => {
      rows.push(["Semester", s.semester, s.total_students, s.avg_risk_score, s.high_risk_count, `${s.high_risk_pct}%`]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `deidentified_retention_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-muted)" }}>Aggregating institutional UDAAN analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "3rem" }}>
        <div className="card" style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem" }}>
          <AlertTriangle size={32} color="var(--risk-high-accent)" style={{ margin: "0 auto 0.75rem" }} />
          <h3>Analytics Unavailable</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>{error}</p>
        </div>
      </div>
    );
  }

  const { overall_risk_distribution: dist, department_breakdown: depts, semester_breakdown: sems, intervention_outcomes: inter } = analytics;

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Title & Export */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            UDAAN • Institutional Review & Governance
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Academic Retention & Risk Analytics
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            De-identified aggregate overview of risk distributions, department outcomes, and support intervention completion.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={15} />
            <span>Export De-Identified CSV</span>
          </button>
          <button onClick={() => setActivePage("model-card")} className="btn btn-primary btn-sm">
            <span>Model Transparency Card</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid-cols-12">
        <div className="col-span-3 card">
          <div className="stat-value">{analytics.registered_students}</div>
          <div className="stat-label">Total Registered Students</div>
        </div>
        <div className="col-span-3 card" style={{ borderLeft: "4px solid var(--risk-high-accent)" }}>
          <div className="stat-value" style={{ color: "var(--risk-high-accent)" }}>
            {dist.high_percentage}%
          </div>
          <div className="stat-label">Priority Support ({dist.high_count} students)</div>
        </div>
        <div className="col-span-3 card" style={{ borderLeft: "4px solid var(--risk-medium-accent)" }}>
          <div className="stat-value" style={{ color: "var(--risk-medium-accent)" }}>
            {dist.medium_percentage}%
          </div>
          <div className="stat-label">Targeted Support ({dist.medium_count} students)</div>
        </div>
        <div className="col-span-3 card" style={{ borderLeft: "4px solid var(--accent-primary)" }}>
          <div className="stat-value" style={{ color: "var(--accent-primary)" }}>
            {inter.completion_rate_pct}%
          </div>
          <div className="stat-label">Intervention Completion Rate</div>
        </div>
      </div>

      {/* Risk Distribution Breakdown Card */}
      <div className="grid-cols-12">
        <div className="col-span-12 card">
          <div className="card-header">
            <span className="card-title">Overall Institutional Risk Distribution</span>
            <span className="card-subtitle">Sample size: {analytics.evaluated_students} evaluated students</span>
          </div>

          <div style={{ display: "flex", height: "32px", borderRadius: "var(--radius-md)", overflow: "hidden", margin: "1rem 0" }}>
            <div
              style={{ width: `${dist.low_percentage}%`, background: "var(--risk-low-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "0.8rem", fontWeight: 700 }}
              title={`Low Risk: ${dist.low_count} students (${dist.low_percentage}%)`}
            >
              {dist.low_percentage > 10 && `Low ${dist.low_percentage}%`}
            </div>
            <div
              style={{ width: `${dist.medium_percentage}%`, background: "var(--risk-medium-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "0.8rem", fontWeight: 700 }}
              title={`Medium Risk: ${dist.medium_count} students (${dist.medium_percentage}%)`}
            >
              {dist.medium_percentage > 10 && `Medium ${dist.medium_percentage}%`}
            </div>
            <div
              style={{ width: `${dist.high_percentage}%`, background: "var(--risk-high-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "0.8rem", fontWeight: 700 }}
              title={`High Risk: ${dist.high_count} students (${dist.high_percentage}%)`}
            >
              {dist.high_percentage > 10 && `High ${dist.high_percentage}%`}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-around", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--risk-low-accent)" }} />
              <span>Low Risk (0–29): <strong>{dist.low_count}</strong> ({dist.low_percentage}%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--risk-medium-accent)" }} />
              <span>Medium Risk (30–59): <strong>{dist.medium_count}</strong> ({dist.medium_percentage}%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--risk-high-accent)" }} />
              <span>Priority Support (60–100): <strong>{dist.high_count}</strong> ({dist.high_percentage}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="grid-cols-12">
        <div className="col-span-8 card">
          <div className="card-header">
            <span className="card-title">Department Comparisons</span>
            <Building size={18} color="var(--accent-primary)" />
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Students</th>
                  <th>Avg Risk Score</th>
                  <th>Priority Support %</th>
                  <th>Avg Attendance</th>
                  <th>Avg GPA (0-10)</th>
                </tr>
              </thead>
              <tbody>
                {depts.map((d) => (
                  <tr key={d.department}>
                    <td style={{ fontWeight: 700 }}>{d.department}</td>
                    <td>{d.total_students}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{d.avg_risk_score}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/100</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${d.high_risk_pct > 30 ? "badge-high" : d.high_risk_pct > 15 ? "badge-medium" : "badge-low"}`}
                        style={{ fontSize: "0.75rem" }}
                      >
                        {d.high_risk_pct}% ({d.high_risk_count})
                      </span>
                    </td>
                    <td>{d.avg_attendance}%</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{d.avg_gpa.toFixed(2)}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}> / 10</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Semester Standing Breakdown */}
        <div className="col-span-4 card">
          <div className="card-header">
            <span className="card-title">Level / Semester Trends</span>
            <GraduationCap size={18} color="var(--accent-primary)" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sems.map((s) => (
              <div
                key={s.semester}
                style={{
                  background: "var(--bg-subtle)",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem" }}>
                  <span>{s.semester}</span>
                  <span>{s.avg_risk_score} avg score</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  <span>{s.total_students} students</span>
                  <span style={{ color: s.high_risk_pct > 25 ? "var(--risk-high-accent)" : "inherit" }}>
                    {s.high_risk_pct}% priority support
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Support & Interventions Completion Card */}
      <div className="grid-cols-12">
        <div className="col-span-12 card">
          <div className="card-header">
            <span className="card-title">Advisor Support & Intervention Efficacy</span>
            <CheckCircle2 size={18} color="var(--accent-primary)" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Total Actions Logged
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.25rem" }}>
                {inter.total_interventions}
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Completed Consultations
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-primary)", marginTop: "0.25rem" }}>
                {inter.completed_interventions}
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Scheduled Appointments
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--risk-medium-accent)", marginTop: "0.25rem" }}>
                {inter.scheduled_interventions}
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Pending Student Requests
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.25rem" }}>
                {inter.requested_interventions}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Privacy Notice */}
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
        <Info size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Data Governance Assurance:</strong> In compliance with academic privacy regulations, management users have access exclusively to aggregated cohort data. Direct browsing of identified individual student profiles is restricted by server-side authorization.
        </span>
      </div>
    </div>
  );
}
