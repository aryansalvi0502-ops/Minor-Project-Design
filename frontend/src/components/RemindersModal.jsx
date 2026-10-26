import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Modal } from "./Modal";
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export function RemindersModal({ isOpen, onClose }) {
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    sms_enabled: false,
    in_app_enabled: true,
    assignment_lead_hours: 24,
    study_session_reminders: true,
    advisor_meeting_reminders: true,
  });

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [activeTab, setActiveTab] = useState("reminders"); // "reminders" | "preferences" | "create"
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Create reminder form
  const [newReminder, setNewReminder] = useState({
    title: "",
    reminder_type: "StudySession",
    channel: "in_app",
    due_at: new Date(Date.now() + 3600000 * 4).toISOString().slice(0, 16),
  });
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prefsData, remsData] = await Promise.all([
        api.notifications.getPreferences().catch(() => null),
        api.notifications.getReminders().catch(() => []),
      ]);
      if (prefsData) {
        setPreferences((prev) => ({
          ...prev,
          ...prefsData,
          email_enabled: prefsData.email_enabled ?? prefsData.email_notifications ?? true,
          in_app_enabled: prefsData.in_app_enabled ?? prefsData.risk_alert_notifications ?? true,
          study_session_reminders: prefsData.study_session_reminders ?? prefsData.daily_study_reminders ?? true,
          assignment_lead_hours: prefsData.assignment_lead_hours ?? 24,
        }));
      }
      if (Array.isArray(remsData)) {
        setReminders(remsData);
      }
    } catch (err) {
      console.error("Failed to load reminder settings:", err);
      setErrorMessage("Failed to load reminder data: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setFeedbackMsg("");
      loadData();
    }
  }, [isOpen]);

  const handleTabChange = (tab) => {
    setErrorMessage("");
    setActiveTab(tab);
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSavingPrefs(true);
      setErrorMessage("");
      const updated = await api.notifications.updatePreferences(preferences);
      setPreferences((prev) => ({ ...prev, ...updated }));
      setFeedbackMsg("Notification preferences successfully updated!");
      setTimeout(() => setFeedbackMsg(""), 3500);
    } catch (err) {
      setErrorMessage("Failed to update preferences: " + (err.message || "Unknown error"));
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleToggleReminder = async (id, currentStatus) => {
    try {
      setErrorMessage("");
      await api.notifications.toggleReminder(id, !currentStatus);
      await loadData();
    } catch (err) {
      setErrorMessage("Failed to toggle reminder: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      setErrorMessage("");
      await api.notifications.deleteReminder(id);
      await loadData();
      setFeedbackMsg("Reminder deleted.");
      setTimeout(() => setFeedbackMsg(""), 3000);
    } catch (err) {
      setErrorMessage("Failed to delete reminder: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (creating) return; // Prevent duplicate submissions

    // Client-side validation
    const title = (newReminder.title || "").trim();
    if (!title) {
      setErrorMessage("Please enter a reminder title.");
      return;
    }

    if (!newReminder.due_at) {
      setErrorMessage("Please select an alert date and time.");
      return;
    }

    const scheduledDate = new Date(newReminder.due_at);
    if (isNaN(scheduledDate.getTime())) {
      setErrorMessage("The selected alert date and time is invalid.");
      return;
    }

    if (scheduledDate.getTime() <= Date.now()) {
      setErrorMessage("Alert date and time must be set in the future.");
      return;
    }

    try {
      setCreating(true);
      setErrorMessage("");
      setFeedbackMsg("");

      await api.notifications.createReminder({
        title: title,
        reminder_type: newReminder.reminder_type || "StudySession",
        channel: newReminder.channel || "in_app",
        due_at: scheduledDate.toISOString(),
      });

      // Reset form only on successful persistence
      setNewReminder({
        title: "",
        reminder_type: "StudySession",
        channel: "in_app",
        due_at: new Date(Date.now() + 3600000 * 4).toISOString().slice(0, 16),
      });

      setFeedbackMsg("Reminder scheduled successfully!");
      setActiveTab("reminders");
      await loadData();
    } catch (err) {
      console.error("Failed to schedule reminder:", err);
      // Readable error message preserved without [object Object]
      setErrorMessage(err.message || "Failed to schedule reminder. Please check your inputs.");
    } finally {
      // Guaranteed to unstick loading state even on failure
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification & Reminder Settings">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "0.5rem",
          }}
        >
          <button
            onClick={() => handleTabChange("reminders")}
            className={`btn btn-sm ${activeTab === "reminders" ? "btn-primary" : "btn-secondary"}`}
          >
            <Bell size={14} />
            <span>Active Reminders ({reminders.length})</span>
          </button>
          <button
            onClick={() => handleTabChange("create")}
            className={`btn btn-sm ${activeTab === "create" ? "btn-primary" : "btn-secondary"}`}
          >
            <Plus size={14} />
            <span>Schedule Reminder</span>
          </button>
          <button
            onClick={() => handleTabChange("preferences")}
            className={`btn btn-sm ${activeTab === "preferences" ? "btn-primary" : "btn-secondary"}`}
          >
            <Mail size={14} />
            <span>Channel Preferences</span>
          </button>
        </div>

        {/* Success Feedback Banner */}
        {feedbackMsg && (
          <div
            style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              color: "var(--risk-low-accent)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.825rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            style={{
              padding: "0.65rem 0.85rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: "var(--risk-high-accent, #EF4444)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.825rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ wordBreak: "break-word" }}>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Active Reminders List */}
        {activeTab === "reminders" && (
          <div>
            {loading ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                Loading reminders...
              </div>
            ) : reminders.length === 0 ? (
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
                No active notifications scheduled. Click <strong>Schedule Reminder</strong> to set reminders for assignments or study blocks.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "380px", overflowY: "auto" }}>
                {reminders.map((rem) => {
                  const isActive = rem.is_active ?? !rem.is_completed;
                  const displayTime = rem.due_at || rem.target_date;
                  return (
                    <div
                      key={rem.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: isActive ? "var(--bg-surface)" : "var(--bg-subtle)",
                        border: "1px solid var(--border-subtle)",
                        opacity: isActive ? 1 : 0.6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <button
                          onClick={() => handleToggleReminder(rem.id, isActive)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          title={isActive ? "Disable reminder" : "Enable reminder"}
                        >
                          {isActive ? (
                            <ToggleRight size={22} color="var(--accent-primary)" />
                          ) : (
                            <ToggleLeft size={22} color="var(--text-muted)" />
                          )}
                        </button>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                            {rem.title}
                          </div>
                          <div style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2px", flexWrap: "wrap" }}>
                            <span style={{ textTransform: "uppercase", fontWeight: 600 }}>{rem.reminder_type}</span>
                            <span>•</span>
                            <span>Channel: <strong>{rem.channel || "in_app"}</strong></span>
                            <span>•</span>
                            <span>
                              Time:{" "}
                              {displayTime
                                ? new Date(displayTime).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Scheduled"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteReminder(rem.id)}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                        title="Delete reminder"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Schedule New Reminder Form */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateReminder}>
            <div className="form-group">
              <label className="form-label">Reminder Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Complete Dynamic Programming Lab"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                className="form-input"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={newReminder.reminder_type}
                  onChange={(e) => setNewReminder({ ...newReminder, reminder_type: e.target.value })}
                  className="form-select"
                >
                  <option value="Assignment">Assignment Deadline</option>
                  <option value="StudySession">Study Block</option>
                  <option value="AdvisorMeeting">Advisor Check-In</option>
                  <option value="Custom">Custom Self-Reminder</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Channel</label>
                <select
                  value={newReminder.channel}
                  onChange={(e) => setNewReminder({ ...newReminder, channel: e.target.value })}
                  className="form-select"
                >
                  <option value="in_app">In-App Notification</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS Text Alert</option>
                </select>
                <p style={{ fontSize: "0.725rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  In-app alerts display in your portal bell drawer. External email & SMS delivery requires university gateway credentials.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alert Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={newReminder.due_at}
                onChange={(e) => setNewReminder({ ...newReminder, due_at: e.target.value })}
                className="form-input"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => handleTabChange("reminders")}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn btn-primary"
              >
                <span>{creating ? "Scheduling..." : "Schedule Reminder"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Notification Preferences Form */}
        {activeTab === "preferences" && (
          <form onSubmit={handleSavePreferences}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Configure how and when the UDAAN system alerts you about study blocks, assignment due dates, and advisor appointments.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-subtle)",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>In-App Notifications</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Display alerts in the top portal bell drawer.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.in_app_enabled}
                  onChange={(e) => setPreferences({ ...preferences, in_app_enabled: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary)" }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-subtle)",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Email Notifications</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Send scheduled summaries and urgent milestone deadlines to your institutional inbox.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) => setPreferences({ ...preferences, email_enabled: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary)" }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-subtle)",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>SMS / Mobile Alerts</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Critical 2-hour reminders for exam sessions or mandatory advisor meetings.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.sms_enabled}
                  onChange={(e) => setPreferences({ ...preferences, sms_enabled: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--accent-primary)" }}
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Assignment Deadline Lead Time</label>
              <select
                value={preferences.assignment_lead_hours}
                onChange={(e) => setPreferences({ ...preferences, assignment_lead_hours: parseInt(e.target.value) })}
                className="form-select"
              >
                <option value={12}>12 hours prior to deadline</option>
                <option value={24}>24 hours prior (Recommended)</option>
                <option value={48}>48 hours prior (Advance planning)</option>
                <option value={72}>72 hours prior</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button
                type="submit"
                disabled={savingPrefs}
                className="btn btn-primary"
              >
                <span>{savingPrefs ? "Saving Preferences..." : "Save Preferences"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
