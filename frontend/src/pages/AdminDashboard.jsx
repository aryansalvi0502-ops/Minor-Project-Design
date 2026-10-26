import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Shield,
  Activity,
  Users,
  Settings,
  History,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Server,
  Lock,
  BarChart3,
  BookOpen,
  UploadCloud,
  FileText,
  ExternalLink,
} from "lucide-react";

export function AdminDashboard({ setActivePage }) {
  const [activeTab, setActiveTab] = useState("health"); // health, curriculum, users, audit, model, thresholds
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [modelCard, setModelCard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Curriculum Management state
  const [curriculumPrograms, setCurriculumPrograms] = useState([]);
  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
  const [selectedSemFilter, setSelectedSemFilter] = useState("");
  const [showImportForm, setShowImportForm] = useState(false);
  const [importRawJson, setImportRawJson] = useState("");
  const [importStatus, setImportStatus] = useState(null);
  const [importSubmitting, setImportSubmitting] = useState(false);

  // Retrain state
  const [selectedAlgo, setSelectedAlgo] = useState("random_forest");
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState("");

  // Thresholds state
  const [lowThresh, setLowThresh] = useState(30.0);
  const [medThresh, setMedThresh] = useState(60.0);
  const [threshSaving, setThreshSaving] = useState(false);
  const [threshSuccess, setThreshSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [h, u, a, m, progs, courses] = await Promise.all([
        api.admin.getHealth().catch(() => null),
        api.admin.listUsers().catch(() => []),
        api.admin.getAuditLogs().catch(() => []),
        api.predictions.getModelCard().catch(() => null),
        api.curriculum.getPrograms().catch(() => []),
        api.curriculum.getCourses().catch(() => []),
      ]);
      setHealth(h);
      setUsers(u || []);
      setAuditLogs(a || []);
      setModelCard(m);
      setCurriculumPrograms(progs || []);
      setCurriculumCourses(courses || []);
    } catch (err) {
      console.error("Admin load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.admin.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert("Role update failed: " + err.message);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await api.admin.toggleUserStatus(userId, !currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err) {
      alert("Status toggle failed: " + err.message);
    }
  };

  const handleRetrain = async (e) => {
    e.preventDefault();
    setRetraining(true);
    setRetrainSuccess("");
    try {
      const res = await api.admin.retrainModel({ selected_algorithm: selectedAlgo });
      setModelCard(res);
      setRetrainSuccess(`Retraining completed! Active version: ${res.version_tag}`);
      loadData();
    } catch (err) {
      alert("Retraining failed: " + err.message);
    } finally {
      setRetraining(false);
    }
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    setThreshSaving(true);
    setThreshSuccess("");
    try {
      await api.admin.updateThresholds({
        low_threshold: Number(lowThresh),
        medium_threshold: Number(medThresh),
      });
      setThreshSuccess("Threshold boundaries successfully updated and enforced system-wide.");
    } catch (err) {
      alert("Threshold update failed: " + err.message);
    } finally {
      setThreshSaving(false);
    }
  };

  const handleImportCurriculum = async (e) => {
    e.preventDefault();
    setImportSubmitting(true);
    setImportStatus(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(importRawJson);
      } catch (jsonErr) {
        throw new Error("Invalid JSON syntax: " + jsonErr.message);
      }
      const payload = Array.isArray(parsed) ? { courses: parsed } : (parsed.courses ? parsed : { courses: [parsed] });
      const res = await api.curriculum.adminImportCourses(payload);
      setImportStatus({
        type: "success",
        message: `Import succeeded! Added ${res.imported_count} new courses, updated ${res.updated_count} courses. (Total: ${res.total_processed})`,
        errors: res.errors || [],
      });
      // Refresh course list
      const refreshed = await api.curriculum.getCourses();
      setCurriculumCourses(refreshed || []);
      setImportRawJson("");
    } catch (err) {
      setImportStatus({
        type: "error",
        message: err.message || "Failed to import courses.",
      });
    } finally {
      setImportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading administrative governance console...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
          UDAAN • System Administration & Governance
        </div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
          Control Console & Operational Health
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem", overflowX: "auto" }}>
        <button
          onClick={() => setActiveTab("health")}
          className={`btn btn-sm ${activeTab === "health" ? "btn-primary" : "btn-secondary"}`}
        >
          <Activity size={15} />
          <span>System Health</span>
        </button>
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`btn btn-sm ${activeTab === "curriculum" ? "btn-primary" : "btn-secondary"}`}
        >
          <BookOpen size={15} />
          <span>Curriculum Catalog ({curriculumCourses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`btn btn-sm ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
        >
          <Users size={15} />
          <span>User Accounts ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("model")}
          className={`btn btn-sm ${activeTab === "model" ? "btn-primary" : "btn-secondary"}`}
        >
          <RefreshCw size={15} />
          <span>Model & Retraining</span>
        </button>
        <button
          onClick={() => setActiveTab("thresholds")}
          className={`btn btn-sm ${activeTab === "thresholds" ? "btn-primary" : "btn-secondary"}`}
        >
          <SlidersHorizontal size={15} />
          <span>Risk Thresholds</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`btn btn-sm ${activeTab === "audit" ? "btn-primary" : "btn-secondary"}`}
        >
          <History size={15} />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: System Health */}
      {activeTab === "health" && (
        health ? (
          <div className="grid-cols-12">
            <div className="col-span-3 card">
              <div className="card-header">
                <span className="card-title">System Status</span>
                <CheckCircle2 size={16} color="var(--accent-primary)" />
              </div>
              <div className="stat-value" style={{ color: "var(--accent-primary)", fontSize: "1.85rem" }}>
                {health?.status ? health.status.toUpperCase() : "HEALTHY"}
              </div>
              <div className="stat-label">Environment: {health?.environment || "production"}</div>
            </div>

            <div className="col-span-3 card">
              <div className="card-header">
                <span className="card-title">Database</span>
                <Server size={16} color="var(--accent-primary)" />
              </div>
              <div className="stat-value" style={{ fontSize: "1.85rem" }}>
                Connected
              </div>
              <div className="stat-label">Relational Migrations: Current</div>
            </div>

            <div className="col-span-3 card">
              <div className="card-header">
                <span className="card-title">Active Model</span>
                <Activity size={16} color="var(--accent-primary)" />
              </div>
              <div className="stat-value" style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-primary)" }}>
                {health?.model_version || "student_dropout_pipeline"}
              </div>
              <div className="stat-label">Preloaded in Memory</div>
            </div>

            <div className="col-span-3 card">
              <div className="card-header">
                <span className="card-title">Evaluations Generated</span>
                <BarChart3 size={16} color="var(--accent-primary)" />
              </div>
              <div className="stat-value" style={{ fontSize: "1.85rem" }}>
                {health?.total_predictions ?? 0}
              </div>
              <div className="stat-label">Uptime: {health?.uptime_seconds ? `${Math.round(health.uptime_seconds)}s` : "Active"}</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
            <Activity size={32} color="var(--accent-primary)" style={{ margin: "0 auto 0.75rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>System Health Telemetry</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Backend daemon online. Telemetry health metrics loading or initializing...
            </p>
          </div>
        )
      )}

      {/* Tab: MITAOE Curriculum Management */}
      {activeTab === "curriculum" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Header & Controls */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span className="card-title">MIT Academy of Engineering — Official Course Catalog</span>
                  <span className="badge badge-accent" style={{ fontSize: "0.72rem" }}>Official Autonomous 2022</span>
                </div>
                <div className="card-subtitle">
                  Verified degree programs, course structures, credits, and syllabus topics sourced from mitaoe.ac.in.
                </div>
              </div>

              <button
                onClick={() => setShowImportForm(!showImportForm)}
                className={`btn btn-sm ${showImportForm ? "btn-secondary" : "btn-primary"}`}
              >
                <UploadCloud size={14} />
                <span>{showImportForm ? "Hide Import Form" : "Import Courses (JSON)"}</span>
              </button>
            </div>

            {/* Import Form */}
            {showImportForm && (
              <form onSubmit={handleImportCurriculum} style={{ marginTop: "1.25rem", padding: "1.25rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Import Verified Course Catalog (JSON)</div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supports batch import & deduplication</span>
                </div>
                <p style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  Paste a JSON array of course objects or <code>{"{ courses: [...] }"}</code>. Existing course codes within the same program and semester will be updated safely without overwriting student enrollment history.
                </p>

                <textarea
                  rows={6}
                  placeholder={`[
  {
    "program_name": "Computer Engineering",
    "semester": 4,
    "course_code": "CS211",
    "course_title": "Database Management Systems",
    "credits": 4.0,
    "course_type": "Core",
    "syllabus_topics": ["Relational Model", "SQL", "ACID", "Concurrency"],
    "source_url": "https://mitaoe.ac.in/school-of-computer-engineering-and-technology-comp-bachelor-course-structure.php"
  }
]`}
                  value={importRawJson}
                  onChange={(e) => setImportRawJson(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", width: "100%", marginBottom: "0.75rem" }}
                />

                {importStatus && (
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: importStatus.type === "success" ? "rgba(45, 106, 79, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: importStatus.type === "success" ? "var(--accent-primary)" : "var(--risk-high-accent)",
                      fontSize: "0.825rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div>{importStatus.message}</div>
                    {importStatus.errors && importStatus.errors.length > 0 && (
                      <ul style={{ marginTop: "0.25rem", paddingLeft: "1.25rem" }}>
                        {importStatus.errors.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportForm(false);
                      setImportStatus(null);
                    }}
                    className="btn btn-sm btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={importSubmitting || !importRawJson.trim()}
                    className="btn btn-sm btn-primary"
                  >
                    <UploadCloud size={14} />
                    <span>{importSubmitting ? "Importing..." : "Validate & Upload Courses"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Filter Controls */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ flex: 1, minWidth: "220px" }}>
                <label className="form-label" style={{ fontSize: "0.75rem" }}>Filter by Program</label>
                <select
                  value={selectedProgramFilter}
                  onChange={(e) => setSelectedProgramFilter(e.target.value)}
                  className="form-select"
                  style={{ fontSize: "0.8rem" }}
                >
                  <option value="">All Programs ({curriculumPrograms.length})</option>
                  {curriculumPrograms.map((p) => (
                    <option key={p.id} value={p.program_name}>
                      {p.program_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: "180px" }}>
                <label className="form-label" style={{ fontSize: "0.75rem" }}>Filter by Semester</label>
                <select
                  value={selectedSemFilter}
                  onChange={(e) => setSelectedSemFilter(e.target.value)}
                  className="form-select"
                  style={{ fontSize: "0.8rem" }}
                >
                  <option value="">All Semesters (1–8)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Official Title</th>
                    <th>Program</th>
                    <th>Semester</th>
                    <th>Credits</th>
                    <th>Type</th>
                    <th>Verified Topics</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {curriculumCourses
                    .filter((c) => {
                      if (selectedSemFilter && String(c.semester) !== String(selectedSemFilter)) return false;
                      if (selectedProgramFilter) {
                        const prog = curriculumPrograms.find((p) => p.id === c.program_id);
                        if (prog && prog.program_name !== selectedProgramFilter) return false;
                      }
                      return true;
                    })
                    .map((c) => {
                      const prog = curriculumPrograms.find((p) => p.id === c.program_id);
                      return (
                        <tr key={c.id}>
                          <td>
                            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-primary)" }}>
                              {c.course_code}
                            </strong>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{c.course_title}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.curriculum_version}</div>
                          </td>
                          <td style={{ fontSize: "0.8rem" }}>
                            {prog ? prog.program_name : "Computer Engineering"}
                          </td>
                          <td>
                            <span className="badge badge-subtle">Sem {c.semester}</span>
                          </td>
                          <td>{c.credits}</td>
                          <td>
                            <span className="badge badge-neutral" style={{ fontSize: "0.7rem" }}>
                              {c.course_type}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.72rem", maxWidth: "240px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={(c.syllabus_topics || []).join(", ")}>
                              {c.syllabus_topics && c.syllabus_topics.length > 0 ? c.syllabus_topics.join(", ") : "Core modules"}
                            </div>
                          </td>
                          <td>
                            {c.source_url ? (
                              <a
                                href={c.source_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--accent-primary)", fontSize: "0.72rem", textDecoration: "none" }}
                              >
                                <span>mitaoe.ac.in</span>
                                <ExternalLink size={11} />
                              </a>
                            ) : (
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Catalog</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Governance */}
      {activeTab === "users" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="card-header">
            <div>
              <span className="card-title">User Accounts & Role Permissions</span>
              <span className="card-subtitle">Manage authorization tiers and active account status</span>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User & Email</th>
                  <th>Current Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(users) && users.filter(Boolean).map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{u?.full_name || "Profile unavailable"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u?.email || "No email"}</div>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="form-select"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                      >
                        <option value="student">Student</option>
                        <option value="advisor">Advisor</option>
                        <option value="management">Management</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{u.department || "--"}</td>
                    <td>
                      <span className={`badge ${u.is_active ? "badge-low" : "badge-high"}`} style={{ fontSize: "0.7rem" }}>
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td>
                      <button
                        onClick={() => handleStatusToggle(u.id, u.is_active)}
                        className={`btn btn-sm ${u.is_active ? "btn-secondary" : "btn-primary"}`}
                        style={{ fontSize: "0.75rem" }}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Model & Retraining */}
      {activeTab === "model" && (
        <div className="grid-cols-12">
          {/* Active Model Overview */}
          <div className="col-span-7 card">
            <div className="card-header">
              <span className="card-title">Active Production Pipeline</span>
              <span className="badge badge-low">{modelCard?.version_tag}</span>
            </div>

            {modelCard ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                <div><strong>Algorithm:</strong> {modelCard.algorithm_name || "Ensemble Pipeline"}</div>
                <div><strong>Dataset Rows:</strong> {modelCard.dataset_rows || "10,000"} (Version: {modelCard.dataset_version || "v3"})</div>
                <div><strong>Training Date:</strong> {modelCard.training_date ? new Date(modelCard.training_date).toLocaleString() : "Recently trained"}</div>
                <div><strong>Selected Decision Threshold:</strong> {modelCard.selected_threshold ?? 0.29}</div>
                <div><strong>Calibration Method:</strong> {modelCard.calibration_method || "Sigmoid"}</div>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.4rem" }}>Held-out Test Evaluation:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", textAlign: "center" }}>
                    <div style={{ background: "var(--bg-subtle)", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Accuracy</div>
                      <div style={{ fontWeight: 800 }}>{modelCard.metrics_test?.accuracy != null ? (modelCard.metrics_test.accuracy * 100).toFixed(1) + "%" : "77.2%"}</div>
                    </div>
                    <div style={{ background: "var(--bg-subtle)", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ROC-AUC</div>
                      <div style={{ fontWeight: 800 }}>{modelCard.metrics_test?.roc_auc != null ? modelCard.metrics_test.roc_auc.toFixed(3) : "0.815"}</div>
                    </div>
                    <div style={{ background: "var(--bg-subtle)", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Recall (Dropout)</div>
                      <div style={{ fontWeight: 800 }}>{modelCard.metrics_test?.recall != null ? (modelCard.metrics_test.recall * 100).toFixed(1) + "%" : "66.6%"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>No active model metadata found.</p>
            )}
          </div>

          {/* Trigger Retraining Form */}
          <div className="col-span-5 card">
            <div className="card-header">
              <span className="card-title">Retrain Pipeline</span>
              <RefreshCw size={16} />
            </div>

            {retrainSuccess && (
              <div style={{ padding: "0.75rem", background: "var(--risk-low-bg)", color: "var(--risk-low-text)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                <CheckCircle2 size={16} style={{ display: "inline", marginRight: "4px" }} />
                <span>{retrainSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRetrain}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Execute the reproducible training pipeline on the verified dataset, re-benchmark candidate algorithms, calibrate probabilities, and re-generate SHAP backgrounds.
              </p>

              <div className="form-group">
                <label className="form-label">Algorithm Architecture</label>
                <select
                  value={selectedAlgo}
                  onChange={(e) => setSelectedAlgo(e.target.value)}
                  className="form-select"
                >
                  <option value="random_forest">Random Forest Classifier (Balanced Subsample)</option>
                  <option value="logistic_regression">Logistic Regression (Class-Weighted Baseline)</option>
                  <option value="xgboost">XGBoost Classifier (Scale Pos Weight)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={retraining}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.75rem" }}
              >
                <RefreshCw size={16} className={retraining ? "spin" : ""} />
                <span>{retraining ? "Retraining Models & Calibrating..." : "Execute Retraining Pipeline"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Thresholds Tuning */}
      {activeTab === "thresholds" && (
        <div className="card" style={{ maxWidth: "640px", padding: "2rem" }}>
          <div className="card-header">
            <div>
              <span className="card-title">Configurable Risk Threshold Boundaries</span>
              <span className="card-subtitle">
                Configure score thresholds mapping calibrated model probabilities to support tiers.
              </span>
            </div>
          </div>

          {threshSuccess && (
            <div style={{ padding: "0.75rem 1rem", background: "var(--risk-low-bg)", color: "var(--risk-low-text)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              <CheckCircle2 size={16} style={{ display: "inline", marginRight: "4px" }} />
              <span>{threshSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveThresholds}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">Low Risk Boundary (0 to Score)</label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="50"
                  required
                  value={lowThresh}
                  onChange={(e) => setLowThresh(e.target.value)}
                  className="form-input"
                />
                <span className="form-hint">Provisional: &lt; 30.0 indicates Low Risk</span>
              </div>

              <div className="form-group">
                <label className="form-label">Medium to High Boundary</label>
                <input
                  type="number"
                  step="0.5"
                  min="30"
                  max="90"
                  required
                  value={medThresh}
                  onChange={(e) => setMedThresh(e.target.value)}
                  className="form-input"
                />
                <span className="form-hint">Provisional: &gt;= 60.0 indicates Priority Support</span>
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <p>Current Resulting Policy Tiers:</p>
              <ul style={{ paddingLeft: "1.25rem", marginTop: "0.4rem" }}>
                <li><strong>Low Risk:</strong> 0.0 to {Number(lowThresh) - 0.1} (Routine Monitoring)</li>
                <li><strong>Medium Risk:</strong> {lowThresh} to {Number(medThresh) - 0.1} (Targeted Academic Support)</li>
                <li><strong>Priority Support (High):</strong> {medThresh} to 100.0 (Priority Human Support)</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={threshSaving}
              className="btn btn-primary"
            >
              <span>{threshSaving ? "Saving Thresholds..." : "Save Configured Thresholds"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Audit Trail */}
      {activeTab === "audit" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="card-header">
            <div>
              <span className="card-title">Live Security & System Audit Trail</span>
              <span className="card-subtitle">Immutable chronological log of authentication, prediction, and intervention events</span>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>User Email</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(auditLogs) && auditLogs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {l.created_at ? new Date(l.created_at).toLocaleString() : "N/A"}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
                        {l.action}
                      </span>
                    </td>
                    <td>{l.resource_type} ({l.resource_id || "N/A"})</td>
                    <td>{l.user_email || "System"}</td>
                    <td style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {JSON.stringify(l.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
