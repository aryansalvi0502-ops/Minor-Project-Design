import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Database,
  Sliders,
  Cpu,
} from "lucide-react";

export function ModelCardPage() {
  const [modelCard, setModelCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      try {
        setLoading(true);
        const data = await api.predictions.getModelCard();
        setModelCard(data);
      } catch (err) {
        console.error("Failed to load model card:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading official model card & evaluation reports...</p>
      </div>
    );
  }

  if (!modelCard) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ color: "var(--text-muted)" }}>No trained model version available.</p>
      </div>
    );
  }

  const { metrics_test: testM, metrics_val: valM, metrics_train: trainM } = modelCard;

  return (
    <div className="container" style={{ maxWidth: "900px", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
          UDAAN • AI Transparency & Governance
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>
          UDAAN Official Model Card
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Comprehensive documentation of the machine learning pipeline, dataset provenance, held-out test evaluation, probability calibration, and operational limitations.
        </p>
      </div>

      {/* Overview Metadata Card */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <div className="card-header">
          <span className="card-title">Model Overview</span>
          <span className="badge badge-low">{modelCard.version_tag}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Algorithm Architecture</div>
            <div style={{ fontWeight: 700 }}>{modelCard.algorithm_name}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Training Timestamp (UTC)</div>
            <div style={{ fontWeight: 700 }}>{new Date(modelCard.training_date).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Dataset Version & Provenance</div>
            <div style={{ fontWeight: 700 }}>{modelCard.dataset_version} ({modelCard.dataset_rows.toLocaleString()} records)</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Probability Calibration</div>
            <div style={{ fontWeight: 700 }}>{modelCard.calibration_method || "Sigmoid Platt Scaling"}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Target Definition</div>
            <div style={{ fontWeight: 700 }}>Binary: Dropout (1) vs. Retained/Enrolled/Graduated (0)</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Decision Threshold</div>
            <div style={{ fontWeight: 700 }}>{modelCard.selected_threshold} (Tuned for support identification)</div>
          </div>
        </div>
      </div>

      {/* Held-out Test Metrics */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <div className="card-header">
          <div>
            <span className="card-title">Empirical Evaluation on Held-out Test Set (N=1,500)</span>
            <span className="card-subtitle">
              Strictly evaluated on unseen student records never touched during feature selection or training.
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", textAlign: "center", margin: "1rem 0" }}>
          <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Accuracy</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{(testM.accuracy * 100).toFixed(1)}%</div>
          </div>
          <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ROC-AUC</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-primary)" }}>{testM.roc_auc.toFixed(3)}</div>
          </div>
          <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PR-AUC</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{testM.pr_auc.toFixed(3)}</div>
          </div>
          <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Recall (Dropout)</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-primary)" }}>{(testM.recall * 100).toFixed(1)}%</div>
          </div>
          <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Precision</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{(testM.precision * 100).toFixed(1)}%</div>
          </div>
          <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>F1-Score</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{testM.f1.toFixed(3)}</div>
          </div>
        </div>

        {/* Confusion Matrix Table */}
        {testM.confusion_matrix && (
          <div style={{ marginTop: "1.5rem" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Test Set Confusion Matrix:
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", maxWidth: "420px", textAlign: "center" }}>
              <div style={{ background: "var(--bg-subtle)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>True Retained (TN)</div>
                <div style={{ fontWeight: 800, fontSize: "1.25rem" }}>{testM.true_negatives}</div>
              </div>
              <div style={{ background: "var(--bg-subtle)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>False Alarms (FP)</div>
                <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--risk-medium-accent)" }}>{testM.false_positives}</div>
              </div>
              <div style={{ background: "var(--bg-subtle)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Missed At-Risk (FN)</div>
                <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--risk-high-accent)" }}>{testM.false_negatives}</div>
              </div>
              <div style={{ background: "var(--bg-subtle)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Identified At-Risk (TP)</div>
                <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--accent-primary)" }}>{testM.true_positives}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Attribution & Explanation Protocol */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <div className="card-header">
          <span className="card-title">Feature Attribution & SHAP Methodology</span>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Global and individual feature importance values are calculated using SHapley Additive exPlanations (SHAP). SHAP allocates credit to each feature according to its marginal contribution to the model's log-odds score relative to an empirical baseline. Numerical variables are imputed using training medians and standardized; categorical variables are one-hot encoded with explicit handling of unknown or missing inputs.
        </p>

        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>Features Evaluated by the Model ({modelCard.features_used.length} inputs):</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {modelCard.features_used.map((f) => (
              <span key={f} className="badge badge-neutral" style={{ fontSize: "0.75rem", textTransform: "none" }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Documented Ethical Limitations */}
      <div className="card" style={{ padding: "1.75rem", borderLeft: "4px solid var(--risk-medium-accent)" }}>
        <div className="card-header">
          <span className="card-title">Ethical Considerations & Limitations</span>
          <AlertTriangle size={18} color="var(--risk-medium-accent)" />
        </div>
        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.6rem", lineHeight: 1.5 }}>
          <p>
            <strong>1. Observational Associations:</strong> The model captures historical statistical correlations present in training data. A high risk score does not prove that a student will drop out, nor does a low score guarantee graduation.
          </p>
          <p>
            <strong>2. Non-Punitive Mandate:</strong> The system is strictly forbidden from being used for admissions, academic disqualification, or punitive decisions. It exists exclusively to direct resources and supportive mentorship.
          </p>
          <p>
            <strong>3. Right to Inspection & Correction:</strong> Students have the absolute right to view their contributing factors, correct inaccurate records, and request reassessment.
          </p>
        </div>
      </div>
    </div>
  );
}
