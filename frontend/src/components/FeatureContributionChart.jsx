import React from "react";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

export function FeatureContributionChart({ contributions = [], maxItems = 7 }) {
  if (!contributions || contributions.length === 0) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        No feature contribution data available for this prediction.
      </div>
    );
  }

  const items = contributions.slice(0, maxItems);
  const maxAbsVal = Math.max(...items.map((i) => i.importance || 0.001), 0.1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <span>Contributing Attribute & Observed Value</span>
        <span>Relative Model Impact</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {items.map((item, idx) => {
          const isRiskUp = item.effect === "increases_risk";
          const widthPct = Math.min(100, Math.max(8, ((item.importance || 0.01) / maxAbsVal) * 100));

          return (
            <div
              key={idx}
              style={{
                background: "var(--bg-subtle)",
                padding: "0.65rem 0.85rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {isRiskUp ? (
                    <TrendingUp size={15} color="var(--risk-high-accent)" />
                  ) : (
                    <TrendingDown size={15} color="var(--accent-primary)" />
                  )}
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {item.feature_label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      background: "var(--bg-surface)",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    Value: {String(item.value)}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: isRiskUp ? "var(--risk-high-accent)" : "var(--accent-primary)",
                  }}
                >
                  {isRiskUp ? "+ Higher Risk" : "- Lowers Risk"}
                </span>
              </div>

              {/* Bar visualization */}
              <div
                style={{
                  height: "8px",
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-full)",
                  overflow: "hidden",
                  margin: "0.35rem 0",
                  display: "flex",
                  justifyContent: isRiskUp ? "flex-start" : "flex-end",
                }}
              >
                <div
                  style={{
                    width: `${widthPct}%`,
                    height: "100%",
                    backgroundColor: isRiskUp ? "var(--risk-high-accent)" : "var(--accent-primary)",
                    borderRadius: "var(--radius-full)",
                  }}
                />
              </div>

              <div style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                {item.description}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          padding: "0.5rem",
          background: "var(--bg-subtle)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <Info size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
        <span>
          SHAP feature contributions represent empirical associations from student training data, not clinical or personal proof of causation.
        </span>
      </div>
    </div>
  );
}
