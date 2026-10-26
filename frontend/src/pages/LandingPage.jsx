import React from "react";
import { Shield, Sparkles, TrendingUp, Users, CheckCircle2, ArrowRight, Lock, BookOpen } from "lucide-react";

export function LandingPage({ setActivePage }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
      {/* Hero Section */}
      <section
        style={{
          textAlign: "center",
          padding: "3.5rem 1rem 2rem",
          maxWidth: "880px",
          margin: "0 auto",
        }}
      >
        <div
          className="badge badge-low"
          style={{ marginBottom: "1rem", display: "inline-flex", gap: "0.4rem" }}
        >
          <Sparkles size={14} />
          <span>UDAAN • Student Success & Early-Warning System</span>
        </div>

        <h1
          style={{
            fontSize: "2.75rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            color: "var(--text-primary)",
            marginBottom: "1.25rem",
          }}
        >
          Proactive Guidance, Transparent AI, and Personalized Academic Recovery
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: "720px",
            margin: "0 auto 2rem",
          }}
        >
          UDAAN is an ethical, non-punitive early-warning system designed to identify students needing support before withdrawal happens. Powered by calibrated machine learning and SHAP explainability.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setActivePage("login")}
            className="btn btn-primary"
            style={{ padding: "0.75rem 1.75rem", fontSize: "1rem" }}
          >
            <span>Access Portal</span>
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => setActivePage("model-card")}
            className="btn btn-secondary"
            style={{ padding: "0.75rem 1.5rem" }}
          >
            <BookOpen size={17} />
            <span>View Verified Model Card</span>
          </button>
        </div>
      </section>

      {/* KPI Highlights */}
      <section className="container">
        <div className="grid-cols-12">
          <div className="col-span-3 card" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ color: "var(--accent-primary)" }}>10,000</div>
            <div className="stat-label">Verified Student Records</div>
          </div>
          <div className="col-span-3 card" style={{ textAlign: "center" }}>
            <div className="stat-value">0.82</div>
            <div className="stat-label">Held-out ROC-AUC Score</div>
          </div>
          <div className="col-span-3 card" style={{ textAlign: "center" }}>
            <div className="stat-value">SHAP</div>
            <div className="stat-label">Transparent Explanations</div>
          </div>
          <div className="col-span-3 card" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ color: "var(--risk-low-accent)" }}>100%</div>
            <div className="stat-label">Non-Punitive Support Promise</div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="container">
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Engineered for Responsibility, Privacy & Impact
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Moving beyond opaque black-box scoring to human-centered academic mentorship.
          </p>
        </div>

        <div className="grid-cols-12">
          <div className="col-span-4 card">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-md)",
                background: "var(--risk-low-bg)",
                color: "var(--risk-low-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <Shield size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Strict Identity Separation
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Names, student identifiers, and contact details are stored completely separately from predictive features, preventing demographic leakage and institutional profiling.
            </p>
          </div>

          <div className="col-span-4 card">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-md)",
                background: "var(--risk-medium-bg)",
                color: "var(--risk-medium-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Calibrated Probabilities & SHAP
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Probabilities are calibrated with sigmoid Platt scaling. Every prediction breaks down exact factors increasing or reducing risk so students and advisors know where to focus.
            </p>
          </div>

          <div className="col-span-4 card">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-md)",
                background: "var(--accent-primary-subtle)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Actionable Recovery Plans
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              A prediction is never left as a dead-end number. Students receive custom study timetables, attendance goals, and confidential advisor assistance requests.
            </p>
          </div>
        </div>
      </section>

      {/* Role-Based Workflows */}
      <section className="container">
        <div className="card" style={{ padding: "2.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>
            Four Tailored Security Roles
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            <div>
              <span className="badge badge-low" style={{ marginBottom: "0.5rem" }}>Student Self-Service</span>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                Inspect your risk factors, customize daily study blocks, track milestone checklists, and request confidential advisor check-ins.
              </p>
            </div>
            <div>
              <span className="badge badge-medium" style={{ marginBottom: "0.5rem" }}>Faculty Advisors</span>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                Review assigned cohort students, examine SHAP feature drivers, schedule guidance meetings, and maintain confidential staff notes.
              </p>
            </div>
            <div>
              <span className="badge badge-neutral" style={{ marginBottom: "0.5rem" }}>Management Reviewers</span>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                Analyze aggregate risk distributions, monitor department trends over time, evaluate support outcomes, and export de-identified summaries.
              </p>
            </div>
            <div>
              <span className="badge badge-high" style={{ marginBottom: "0.5rem" }}>System Administrators</span>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                Manage user permissions, monitor system uptime, tune risk threshold boundaries, inspect audit trails, and trigger pipeline retraining.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
