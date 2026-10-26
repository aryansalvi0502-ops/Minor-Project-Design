import React from "react";
import { Shield, Lock, Eye, Users, CheckCircle2, AlertCircle, HeartHandshake } from "lucide-react";

export function ResponsibleUsePage() {
  return (
    <div className="container" style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
          UDAAN • AI Ethics & Institutional Safeguards
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>
          Responsible Use & Student Privacy Policy
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Our binding commitment to human dignity, data protection, transparency, and non-punitive supportive intervention.
        </p>
      </div>

      <div className="card" style={{ padding: "1.75rem", borderLeft: "4px solid var(--accent-primary)" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HeartHandshake size={20} color="var(--accent-primary)" />
          <span>The Non-Punitive Guarantee</span>
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          The UDAAN early-warning system is designed with an unconditional institutional guarantee: <strong>No student will ever be penalized, stigmatized, restricted, or academically rejected because of an AI risk score.</strong> A risk score is solely an invitation for priority academic tutoring, wellness check-ins, and resource provision.
        </p>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-6 card">
          <div className="card-header">
            <span className="card-title">Data Privacy & Isolation</span>
            <Lock size={18} color="var(--accent-primary)" />
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Student names, student IDs, email addresses, and passwords are strictly decoupled from machine learning feature vectors. Furthermore, students can only see their own records; faculty advisors can only see their assigned cohort; and management reviewers only see aggregated, de-identified statistics.
          </p>
        </div>

        <div className="col-span-6 card">
          <div className="card-header">
            <span className="card-title">Explainability & Contestability</span>
            <Eye size={18} color="var(--accent-primary)" />
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Every prediction is explained via SHAP factor attribution. Students are not subjected to black-box algorithmic verdicts. If student information changes or is discovered to be inaccurate, students have the right to update their profile and trigger an immediate model re-evaluation.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: "1.75rem" }}>
        <div className="card-header">
          <span className="card-title">Student Rights in the UDAAN System</span>
        </div>
        <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
          <li><strong>Right to Full Transparency:</strong> Inspect every factor contributing to your prediction and review your recovery plan at any time.</li>
          <li><strong>Right to Data Correction:</strong> Correct any incorrect attendance or grade records through your self-service profile editor.</li>
          <li><strong>Right to Human Review:</strong> Request a direct meeting with a faculty advisor to review and adjust your support plan.</li>
          <li><strong>Right to Confidentiality:</strong> Your risk score is never made public or shared with peers or prospective employers.</li>
        </ul>
      </div>
    </div>
  );
}
