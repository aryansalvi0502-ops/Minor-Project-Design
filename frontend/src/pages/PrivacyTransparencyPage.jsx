import React from "react";
import {
  ShieldCheck,
  Eye,
  Lock,
  AlertCircle,
  HelpCircle,
  UserCheck,
  CheckCircle2,
  FileText,
  HeartHandshake,
  ArrowLeft,
  Scale,
} from "lucide-react";

export function PrivacyTransparencyPage({ setActivePage }) {
  return (
    <div className="container" style={{ maxWidth: "980px", margin: "2rem auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div className="card" style={{ background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)", padding: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.75rem", background: "var(--accent-subtle)", color: "var(--accent-primary)", borderRadius: "var(--radius-pill)", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              <ShieldCheck size={16} />
              <span>UDAAN • Ethical AI, Student Privacy & Model Transparency</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Privacy, Explainability & AI Safeguards
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", marginTop: "0.5rem", maxWidth: "720px", lineHeight: 1.6 }}>
              UDAAN (Student Success & Early-Warning System) is built on principles of student wellbeing, complete explainability, and rigorous privacy safeguards. We believe AI should empower students with actionable recovery—never judge or make automated punitive decisions.
            </p>
          </div>

          <button onClick={() => setActivePage("dashboard")} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Core Safeguards 3-Card Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        <div className="card" style={{ borderTop: "4px solid var(--accent-primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <UserCheck size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Human-in-the-Loop Guarantee</h3>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <strong>Zero automated punishment:</strong> Predictions never automatically trigger academic probation, financial aid revocation, or course disqualification. Every intervention requires human faculty review and direct student consultation.
          </p>
        </div>

        <div className="card" style={{ borderTop: "4px solid #6366f1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <Eye size={22} color="#6366f1" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Total Algorithmic Transparency</h3>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <strong>No black boxes:</strong> Every risk score is accompanied by individual SHAP (Shapley Additive Explanations) feature contribution charts showing exactly which factors lowered or elevated your score.
          </p>
        </div>

        <div className="card" style={{ borderTop: "4px solid #10b981" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <Lock size={22} color="#10b981" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Privacy by Design (FERPA/GDPR)</h3>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <strong>Strict data boundaries:</strong> We do not conduct surveillance, browse histories, or track biometric signals. Students possess full access, audit inspection rights, and profile rectification rights.
          </p>
        </div>
      </div>

      {/* What Data We Use vs Never Use */}
      <div className="card" style={{ padding: "2rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Scale size={20} color="var(--accent-primary)" />
          <span>Data Ingestion Boundaries: What We Use vs. What We NEVER Collect</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div style={{ background: "var(--bg-subtle)", padding: "1.5rem", borderRadius: "var(--radius-md)", borderLeft: "4px solid #10b981" }}>
            <div style={{ fontWeight: 700, color: "#10b981", fontSize: "0.95rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={18} />
              <span>Verified Academic Data Used (Model Inputs)</span>
            </div>
            <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <li><strong>Academic Standing:</strong> Cumulative GPA, Semester GPA, and Subject Exam Scores</li>
              <li><strong>Attendance Habits:</strong> Overall class attendance percentage</li>
              <li><strong>Coursework Turnaround:</strong> Assignment delay days</li>
              <li><strong>Study Volume:</strong> Daily self-study hours outside lecture</li>
              <li><strong>Institutional Context:</strong> Department, academic term, scholarship status</li>
              <li><strong>Commute Transit:</strong> One-way transit time in minutes</li>
              <li><strong>Self-Reported Wellness:</strong> Stress index (optional 1.0 to 10.0 scale)</li>
            </ul>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "1.5rem", borderRadius: "var(--radius-md)", borderLeft: "4px solid #ef4444" }}>
            <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.95rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={18} />
              <span>Data NEVER Collected or Monitored</span>
            </div>
            <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <li><strong>No Browser Tracking:</strong> Zero web history or search tracking</li>
              <li><strong>No Keystroke / Eye Tracking:</strong> No proctoring surveillance</li>
              <li><strong>No Private Communications:</strong> No email, chat, or social media access</li>
              <li><strong>No Biometrics / Video Logs:</strong> No facial recognition or webcam analysis</li>
              <li><strong>No Disciplinary Automation:</strong> No automatic reporting to campus police or committees</li>
              <li><strong>No Third-Party Ad Brokers:</strong> Zero data monetized or sold</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Model Limitations & Probabilistic Disclaimers */}
      <div className="card" style={{ padding: "2rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <AlertCircle size={20} color="var(--risk-med-accent)" />
          <span>Understanding Model Limitations & Non-Deterministic Nature</span>
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.925rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <p>
            <strong>1. Association, Not Deterministic Causation:</strong> A risk score of 65/100 does not mean a student is destined to struggle. It simply indicates that historically, students with similar statistical patterns benefited from timely academic support and tutoring.
          </p>
          <p>
            <strong>2. Human Nuance Cannot Be Reduced to Numbers:</strong> The machine-learning model cannot measure personal resilience, creative passion, unexpected illness, family emergencies, or grit. When life happens, human advisors are available to provide compassion, deadline extensions, and workload accommodations.
          </p>
          <p>
            <strong>3. Calibrated Probabilities:</strong> All model outputs are calibrated via Platt Sigmoid scaling, ensuring that predicted percentages align with empirical validation frequencies rather than overconfident uncalibrated margins.
          </p>
          <p>
            <strong>4. Right to Contest & Rectify:</strong> If your profile data contains inaccuracies (e.g., commute time updated, error in logged attendance, or grade correction), you can edit your profile at any time. The system will immediately re-evaluate your UDAAN early-warning score and generate a refreshed recovery roadmap.
          </p>
        </div>
      </div>

      {/* Institutional Rights & Actions */}
      <div className="card" style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem", background: "var(--bg-subtle)" }}>
        <div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Need Assistance or Have Privacy Questions?</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Reach out to your assigned academic advisor or consult the full Model Transparency Card.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={() => setActivePage("model-card")} className="btn btn-secondary">
            <FileText size={16} />
            <span>View Model Card</span>
          </button>
          <button onClick={() => setActivePage("support")} className="btn btn-primary">
            <HeartHandshake size={16} />
            <span>Connect with Advisor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
