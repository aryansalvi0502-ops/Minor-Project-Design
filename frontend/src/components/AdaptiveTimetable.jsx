import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Modal } from "./Modal";
import {
  Calendar,
  Clock,
  BookOpen,
  AlertTriangle,
  Plus,
  CheckCircle,
  Trash2,
  Settings,
  Sparkles,
  Info,
  CalendarCheck,
  Briefcase,
  AlertCircle,
} from "lucide-react";

export function AdaptiveTimetable({ onTimetableUpdated }) {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState("Monday");

  // Deadline modal
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    subject_code: "",
    title: "",
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    priority: "High",
    estimated_hours: 3.0,
  });
  const [deadlineSubmitting, setDeadlineSubmitting] = useState(false);

  // Config modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    weekly_study_hours_target: 15.0,
    preferred_study_window: "Evening",
    blocked_slots: [],
  });
  const [configSubmitting, setConfigSubmitting] = useState(false);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const loadTimetable = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.recovery.getTimetable();
      setTimetableData(data);
      if (data?.config) {
        setConfigForm({
          weekly_study_hours_target: data.config.weekly_study_hours_target || 15.0,
          preferred_study_window: data.config.preferred_study_window || "Evening",
          blocked_slots: data.config.blocked_slots || [],
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load adaptive timetable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const handleToggleDeadline = async (deadlineId, currentStatus) => {
    try {
      await api.recovery.toggleDeadline(deadlineId, !currentStatus);
      await loadTimetable();
      if (onTimetableUpdated) onTimetableUpdated();
    } catch (err) {
      alert("Failed to update deadline: " + err.message);
    }
  };

  const handleDeleteDeadline = async (deadlineId) => {
    if (!window.confirm("Delete this academic deadline?")) return;
    try {
      await api.recovery.deleteDeadline(deadlineId);
      await loadTimetable();
      if (onTimetableUpdated) onTimetableUpdated();
    } catch (err) {
      alert("Failed to delete deadline: " + err.message);
    }
  };

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    try {
      setDeadlineSubmitting(true);
      await api.recovery.createDeadline({
        ...newDeadline,
        due_date: new Date(newDeadline.due_date).toISOString(),
        estimated_hours: parseFloat(newDeadline.estimated_hours),
      });
      setIsDeadlineModalOpen(false);
      setNewDeadline({
        subject_code: "",
        title: "",
        due_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        priority: "High",
        estimated_hours: 3.0,
      });
      await loadTimetable();
      if (onTimetableUpdated) onTimetableUpdated();
    } catch (err) {
      alert("Failed to add deadline: " + err.message);
    } finally {
      setDeadlineSubmitting(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setConfigSubmitting(true);
      await api.recovery.updateTimetableConfig({
        weekly_study_hours_target: parseFloat(configForm.weekly_study_hours_target),
        preferred_study_window: configForm.preferred_study_window,
        blocked_slots: configForm.blocked_slots,
      });
      setIsConfigModalOpen(false);
      await loadTimetable();
      if (onTimetableUpdated) onTimetableUpdated();
    } catch (err) {
      alert("Failed to update availability preferences: " + err.message);
    } finally {
      setConfigSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        <Clock className="spin" size={24} style={{ margin: "0 auto 0.5rem" }} />
        <div>Generating your conflict-free adaptive timetable...</div>
      </div>
    );
  }

  const scheduleForDay = timetableData?.schedule?.[activeDay] || [];
  const deadlines = timetableData?.upcoming_deadlines || [];

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      {/* Header */}
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
            <Calendar size={20} color="var(--accent-primary)" />
            <span className="card-title" style={{ fontSize: "1.15rem", fontWeight: 800 }}>
              Adaptive Study & Lecture Schedule
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-subtle)",
                color: "var(--accent-primary)",
                fontWeight: 700,
              }}
            >
              Conflict-Free
            </span>
          </div>
          <p className="card-subtitle" style={{ marginTop: "0.25rem" }}>
            Dynamically schedules focused study blocks around your fixed class timetable, part-time commitments, and prioritized subject learning gaps.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setIsDeadlineModalOpen(true)}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={14} />
            <span>Add Deadline</span>
          </button>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="btn btn-outline btn-sm"
          >
            <Settings size={14} />
            <span>Availability & Preferences</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem", backgroundColor: "rgba(239,68,68,0.1)", color: "var(--risk-high-accent)", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Preferences & Deadlines Quick Ribbon */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
          backgroundColor: "var(--bg-subtle)",
          padding: "0.85rem 1rem",
          borderRadius: "var(--radius-md)",
          fontSize: "0.8rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <span style={{ color: "var(--text-muted)" }}>Target Study Load: </span>
          <strong>{timetableData?.config?.weekly_study_hours_target || 15} hrs/week</strong>
        </div>
        <div>
          <span style={{ color: "var(--text-muted)" }}>Optimal Study Window: </span>
          <strong>{timetableData?.config?.preferred_study_window || "Evening"}</strong>
        </div>
        <div>
          <span style={{ color: "var(--text-muted)" }}>Upcoming Deadlines: </span>
          <strong>{deadlines.filter((d) => !d.is_completed).length} pending</strong>
        </div>
      </div>

      {/* Days Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.35rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          marginBottom: "1rem",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {daysOfWeek.map((day) => {
          const dayItems = timetableData?.schedule?.[day] || [];
          const classCount = dayItems.filter((i) => i.type === "class").length;
          const studyCount = dayItems.filter((i) => i.type === "study_session").length;
          const isSelected = activeDay === day;

          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              style={{
                padding: "0.5rem 0.85rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isSelected ? "var(--accent-primary)" : "transparent",
                color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                fontWeight: isSelected ? 700 : 500,
                fontSize: "0.825rem",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.15rem",
                minWidth: "75px",
                transition: "all var(--transition-fast)",
              }}
            >
              <span>{day.slice(0, 3)}</span>
              <span style={{ fontSize: "0.7rem", opacity: isSelected ? 0.9 : 0.6 }}>
                {classCount}c • {studyCount}s
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Schedule & Deadlines Split Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.5rem" }}>
        {/* Day Schedule Timeline */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {activeDay}'s Schedule
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {scheduleForDay.length} scheduled item{scheduleForDay.length !== 1 ? "s" : ""}
            </span>
          </div>

          {scheduleForDay.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            >
              No scheduled lectures or study blocks for {activeDay}. Great day for rest or self-paced review!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {scheduleForDay.map((item, idx) => {
                const isClass = item.type === "class";
                const isGapDriven = item.is_learning_gap_priority;

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.85rem",
                      padding: "0.85rem 1rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isClass
                        ? "var(--bg-surface)"
                        : isGapDriven
                        ? "rgba(239, 68, 68, 0.04)"
                        : "rgba(99, 102, 241, 0.04)",
                      border: "1px solid",
                      borderColor: isClass
                        ? "var(--border-subtle)"
                        : isGapDriven
                        ? "rgba(239, 68, 68, 0.25)"
                        : "rgba(99, 102, 241, 0.25)",
                      borderLeft: `4px solid ${
                        isClass
                          ? "var(--border-subtle)"
                          : isGapDriven
                          ? "var(--risk-high-accent)"
                          : "var(--accent-primary)"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        padding: "0.4rem",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: isClass ? "var(--bg-subtle)" : "rgba(99, 102, 241, 0.1)",
                        color: isClass ? "var(--text-muted)" : "var(--accent-primary)",
                      }}
                    >
                      {isClass ? <CalendarCheck size={18} /> : <BookOpen size={18} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "0.875rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {item.title}
                          </span>
                          <span
                            style={{
                              marginLeft: "0.5rem",
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-muted)",
                            }}
                          >
                            ({item.subject_code})
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: "0.725rem",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Clock size={12} />
                          {item.start_time} - {item.end_time}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {item.room && <span>Room: {item.room}</span>}
                        {item.instructor && <span>• {item.instructor}</span>}
                        {item.rationale && (
                          <span style={{ color: isGapDriven ? "var(--risk-high-accent)" : "var(--text-secondary)" }}>
                            • {item.rationale}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deadlines Section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Upcoming Deadlines & Submissions
            </span>
            <button
              onClick={() => setIsDeadlineModalOpen(true)}
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              + Add
            </button>
          </div>

          {deadlines.length === 0 ? (
            <div
              style={{
                padding: "1.5rem",
                textAlign: "center",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
              }}
            >
              No active deadlines recorded. Add assignment or project dates to automatically prioritize study time.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {deadlines.map((dl) => (
                <div
                  key={dl.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: dl.is_completed ? "var(--bg-subtle)" : "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    opacity: dl.is_completed ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={dl.is_completed}
                      onChange={() => handleToggleDeadline(dl.id, dl.is_completed)}
                      style={{ width: 16, height: 16, accentColor: "var(--accent-primary)", cursor: "pointer" }}
                    />
                    <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      <div
                        style={{
                          fontSize: "0.825rem",
                          fontWeight: 600,
                          textDecoration: dl.is_completed ? "line-through" : "none",
                          color: dl.is_completed ? "var(--text-muted)" : "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {dl.title}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {dl.subject_code} • Due {new Date(dl.due_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 700,
                        backgroundColor:
                          dl.priority === "High"
                            ? "rgba(239, 68, 68, 0.1)"
                            : "var(--bg-subtle)",
                        color:
                          dl.priority === "High"
                            ? "var(--risk-high-accent)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {dl.priority}
                    </span>
                    <button
                      onClick={() => handleDeleteDeadline(dl.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "2px",
                      }}
                      title="Delete deadline"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Deadline Modal */}
      <Modal
        isOpen={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        title="Add Academic Deadline"
      >
        <form onSubmit={handleAddDeadline}>
          <div className="form-group">
            <label className="form-label">Subject Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. CS201 or MATH205"
              value={newDeadline.subject_code}
              onChange={(e) => setNewDeadline({ ...newDeadline, subject_code: e.target.value.toUpperCase() })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Task / Assignment Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dynamic Programming Lab Problem Set"
              value={newDeadline.title}
              onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                required
                value={newDeadline.due_date}
                onChange={(e) => setNewDeadline({ ...newDeadline, due_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={newDeadline.priority}
                onChange={(e) => setNewDeadline({ ...newDeadline, priority: e.target.value })}
                className="form-select"
              >
                <option value="High">High (Immediate Focus)</option>
                <option value="Medium">Medium (Regular)</option>
                <option value="Low">Low (Elective)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Prep Hours</label>
            <input
              type="number"
              min="0.5"
              max="40"
              step="0.5"
              value={newDeadline.estimated_hours}
              onChange={(e) => setNewDeadline({ ...newDeadline, estimated_hours: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => setIsDeadlineModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deadlineSubmitting}
              className="btn btn-primary"
            >
              <span>{deadlineSubmitting ? "Adding..." : "Save Deadline"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Timetable Availability Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Study Availability & Shift Preferences"
      >
        <form onSubmit={handleSaveConfig}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            The timetable engine automatically calculates free periods around your lecture hours and avoids scheduled work or personal commitments.
          </p>

          <div className="form-group">
            <label className="form-label">Weekly Self-Study Goal (Hours)</label>
            <input
              type="number"
              min="2"
              max="40"
              step="1"
              value={configForm.weekly_study_hours_target}
              onChange={(e) => setConfigForm({ ...configForm, weekly_study_hours_target: e.target.value })}
              className="form-input"
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Recommended: 12-18 hours/week for full-time engineering/science majors.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Study Window</label>
            <select
              value={configForm.preferred_study_window}
              onChange={(e) => setConfigForm({ ...configForm, preferred_study_window: e.target.value })}
              className="form-select"
            >
              <option value="Morning">Morning (07:00 - 12:00)</option>
              <option value="Afternoon">Afternoon (12:00 - 17:00)</option>
              <option value="Evening">Evening (17:00 - 21:00) — Most Popular</option>
              <option value="Night">Night (21:00 - 23:00)</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={configSubmitting}
              className="btn btn-primary"
            >
              <span>{configSubmitting ? "Saving..." : "Save Preferences"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
