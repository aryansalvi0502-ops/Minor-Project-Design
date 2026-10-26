import React from "react";
import { ShieldCheck, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";

export function RiskBadge({ category, score, showScore = true }) {
  const normCategory = (category || "Unknown").toLowerCase();

  let badgeClass = "badge-neutral";
  let Icon = HelpCircle;
  let text = "Unassessed";

  if (normCategory === "low") {
    badgeClass = "badge-low";
    Icon = ShieldCheck;
    text = "Low Risk";
  } else if (normCategory === "medium") {
    badgeClass = "badge-medium";
    Icon = AlertTriangle;
    text = "Medium Risk";
  } else if (normCategory === "high") {
    badgeClass = "badge-high";
    Icon = AlertCircle;
    text = "Priority Support";
  }

  return (
    <span className={`badge ${badgeClass}`} title={`Model Risk Tier: ${text}`}>
      <Icon size={13} strokeWidth={2.5} />
      <span>{text}</span>
      {showScore && score !== undefined && score !== null && (
        <span
          style={{
            marginLeft: "0.25rem",
            opacity: 0.9,
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
          }}
        >
          {Number(score).toFixed(0)}/100
        </span>
      )}
    </span>
  );
}
