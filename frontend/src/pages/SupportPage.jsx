import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Users,
  Sparkles,
  UserCheck,
  Calendar,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  PhoneCall,
  HeartHandshake,
} from "lucide-react";

export function SupportPage({ setActivePage }) {
  const [activeTab, setActiveTab] = useState("human"); // "human" or "ai"
  const [advisorInfo, setAdvisorInfo] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Human consultation request form state
  const [topic, setTopic] = useState("Academic Tutoring & GPA Boost");
  const [urgency, setUrgency] = useState("Normal");
  const [notes, setNotes] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState("");
  const [ticketErrorMsg, setTicketErrorMsg] = useState("");

  // AI Chat state in Hub
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to the **UDAAN Academic Hub**! I analyze your academic profile, 10-point GPA standing, and recovery plan to help you study effectively and stay on track. What would you like to explore?",
      suggested_prompts: [
        "How do I raise my GPA above the 6.0 threshold?",
        "What influenced my current risk assessment score?",
        "Help me create a weekly study schedule",
        "Explain active recall techniques for my courses",
      ],
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const loadSupportData = async () => {
    try {
      setLoading(true);
      const [adv, tix] = await Promise.all([
        api.support.getAdvisorInfo().catch(() => null),
        api.support.getMyTickets().catch(() => []),
      ]);
      setAdvisorInfo(adv);
      setTickets(tix || []);
    } catch (err) {
      console.error("Support data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportData();
  }, []);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setSubmittingTicket(true);
    setTicketSuccessMsg("");
    setTicketErrorMsg("");

    try {
      const res = await api.support.requestHumanSupport({
        topic,
        urgency,
        notes,
        preferred_date: preferredDate ? new Date(preferredDate).toISOString() : null,
      });

      setTicketSuccessMsg(
        `Consultation request successfully submitted to ${advisorInfo?.name || "your faculty advisor"}! An in-app notification and advisor task have been dispatched.`
      );
      setNotes("");
      setPreferredDate("");
      await loadSupportData();
      setTimeout(() => setTicketSuccessMsg(""), 6000);
    } catch (err) {
      setTicketErrorMsg(err.message || "Failed to submit consultation request.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleAiSend = async (textToSend) => {
    const text = textToSend || aiInput;
    if (!text.trim() || aiLoading) return;

    const userMsg = { role: "user", content: text };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setAiLoading(true);

    try {
      const chatHistory = aiMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.support.chat(text, chatHistory);

      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          suggested_prompts: res.suggested_prompts || [],
        },
      ]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Encountered a momentary connection pause. Please try again or submit a human advisor ticket.",
          suggested_prompts: ["Schedule Advisor Meeting", "Try again"],
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "1.75rem", width: "100%" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
          UDAAN • Comprehensive Student Success Ecosystem
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)" }}>
          UDAAN Student Support Hub
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "800px", marginTop: "0.25rem" }}>
          Access integrated academic and wellbeing support through direct faculty advisor counseling and 24/7 personalized UDAAN AI tutoring.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("human")}
          className={`btn ${activeTab === "human" ? "btn-primary" : "btn-secondary"}`}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <UserCheck size={18} />
          <span>Pillar 1: Human Faculty Support ({tickets.length} Active Requests)</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`btn ${activeTab === "ai" ? "btn-primary" : "btn-secondary"}`}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Sparkles size={18} />
          <span>Pillar 2: UDAAN AI Academic Assistant</span>
        </button>
      </div>

      {/* TAB 1: HUMAN FACULTY SUPPORT */}
      {activeTab === "human" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "1.75rem",
            width: "100%",
            alignItems: "start",
          }}
        >
          {/* Left Column: Assigned Advisor Card & Crisis Care */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
            {/* Assigned Faculty Advisor Card */}
            <div className="card" style={{ padding: "1.75rem" }}>
              <div className="card-header" style={{ marginBottom: "1rem" }}>
                <span className="card-title">Assigned Faculty Advisor</span>
                <span className="badge badge-low">Official Mentor</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-primary)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1.2rem",
                  }}
                >
                  {advisorInfo?.name ? advisorInfo.name.replace(/^Dr\.\s*|^Prof\.\s*/, "").charAt(0) : "D"}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {advisorInfo?.name || "Disha Malpure Ma'am"}
                  </h3>
                  <div style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                    Department of {advisorInfo?.department || "Computer Engineering, MITAOE"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                  <Mail size={15} color="var(--accent-primary)" />
                  <span>{advisorInfo?.email || "disha.malpure@mitaoe.ac.in"}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>(Sample Faculty Contact)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                  <Clock size={15} color="var(--accent-primary)" />
                  <span>{advisorInfo?.office_hours || "Mon & Thu 2:00 PM – 4:30 PM (IST)"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                  <MapPin size={15} color="var(--accent-primary)" />
                  <span>Room 304, School of Computer Engineering, MITAOE, Alandi, Pune</span>
                </div>
              </div>

              <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "var(--radius-md)", marginTop: "1.25rem", fontSize: "0.775rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                <strong>Advisory Policy:</strong> Assigned faculty mentors review academic milestones, clarify subject backlogs, and confirm scheduled consultation requests within 24 business hours.
              </div>
            </div>

            {/* Campus Wellness & Student Care */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--risk-high-accent)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <HeartHandshake size={18} color="var(--risk-high-accent)" />
                <h4 style={{ fontWeight: 800, fontSize: "0.95rem" }}>Immediate Student Care & Counseling</h4>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                For emotional wellbeing, personal stress, or academic accommodations:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.8rem" }}>
                <div><strong>Academic Counselling Cell:</strong> Dr. Sneha Iyer (Ground Floor, Main Admin Bldg)</div>
                <div><strong>National Tele-MANAS Helpline:</strong> 14416 (Govt of India, Toll-Free 24/7)</div>
                <div><strong>MITAOE Student Welfare:</strong> studentwelfare@mitaoe.ac.in</div>
              </div>
            </div>
          </div>

          {/* Right Column: Book Consultation Form & Tickets Tracker */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
            {/* Consultation Request Form */}
            <div className="card" style={{ padding: "1.75rem" }}>
              <div className="card-header" style={{ marginBottom: "1rem" }}>
                <div>
                  <span className="card-title">Schedule Faculty Consultation</span>
                  <p className="card-subtitle">
                    Request a 1-on-1 check-in with your advisor for academic tutoring, petitions, or personal guidance.
                  </p>
                </div>
              </div>

              {ticketSuccessMsg && (
                <div style={{ padding: "0.75rem 1rem", background: "var(--risk-low-bg)", color: "var(--risk-low-text)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={16} />
                  <span>{ticketSuccessMsg}</span>
                </div>
              )}

              {ticketErrorMsg && (
                <div style={{ padding: "0.75rem 1rem", background: "var(--risk-high-bg)", color: "var(--risk-high-text)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <AlertCircle size={16} />
                  <span>{ticketErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Consultation Focus</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="form-select"
                    >
                      <option value="Academic Tutoring & GPA Boost">Academic Tutoring & GPA Boost</option>
                      <option value="GPA Warning Threshold Review">GPA Warning Threshold Review</option>
                      <option value="Attendance & Course Load Counseling">Attendance & Course Load Counseling</option>
                      <option value="Degree Planning & Elective Milestones">Degree Planning & Elective Milestones</option>
                      <option value="Personal / Mental Wellness Referral">Personal / Mental Wellness Referral</option>
                      <option value="Financial Aid & Scholarship Advisory">Financial Aid & Scholarship Advisory</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Urgency Tier</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="form-select"
                    >
                      <option value="Normal">Normal (Routine Check-in)</option>
                      <option value="High">High (Upcoming Exam / Grade Warning)</option>
                      <option value="Urgent">Urgent (Immediate Academic / Personal Barrier)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="form-input"
                  />
                  <span className="form-hint">Advisor office hours: Mon & Thu 2:00 PM – 4:30 PM</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Discussion Notes & Specific Questions</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Briefly describe what you'd like to review (e.g. challenging course topics, schedule adjustments, or GPA threshold advice)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket || !notes.trim()}
                  className="btn btn-primary"
                  style={{ alignSelf: "flex-start", padding: "0.65rem 1.25rem" }}
                >
                  <Calendar size={15} />
                  <span>{submittingTicket ? "Submitting Request..." : "Submit Consultation Request"}</span>
                </button>
              </form>
            </div>

            {/* Active Support Requests Tracker */}
            <div className="card" style={{ padding: "1.75rem" }}>
              <div className="card-header" style={{ marginBottom: "1rem" }}>
                <div>
                  <span className="card-title">My Consultation History & Advisor Notes</span>
                  <p className="card-subtitle">Track the status of your advisor consultation requests and confirmed meetings.</p>
                </div>
              </div>

              {tickets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  No active or past consultation requests found. Use the form above to book your first advisor check-in.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "1rem",
                        background: "var(--bg-subtle)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{t.topic}</strong>
                        <span
                          className={`badge ${
                            t.status === "completed" ? "badge-low" : t.status === "scheduled" ? "badge-medium" : "badge-neutral"
                          }`}
                        >
                          {t.status === "requested_by_student"
                            ? "Awaiting Advisor Confirmation"
                            : t.status.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <strong>My Request:</strong> {t.student_notes}
                      </div>

                      {t.meeting_date && (
                        <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Calendar size={14} />
                          <span>Confirmed Meeting: {new Date(t.meeting_date).toLocaleString()}</span>
                        </div>
                      )}

                      {t.action_taken && (
                        <div style={{ fontSize: "0.825rem", background: "var(--bg-surface)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--accent-primary)" }}>
                          <strong>Advisor Action / Recommendation:</strong> {t.action_taken}
                        </div>
                      )}

                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "flex-end" }}>
                        Requested {new Date(t.created_at).toLocaleDateString()} with {t.advisor_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUCCESAI ACADEMIC ASSISTANT */}
      {activeTab === "ai" && (
        <div className="card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", minHeight: "650px" }}>
          <div className="card-header" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent-primary)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={20} />
              </div>
              <div>
                <span className="card-title">UDAAN AI Academic Tutor & Guide</span>
                <p className="card-subtitle">
                  Interactive assistant with real-time access to your 10-point GPA, UDAAN early-warning assessment, and recovery plan.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("human")}
              className="btn btn-sm btn-secondary"
            >
              <UserCheck size={15} />
              <span>Switch to Human Advisor</span>
            </button>
          </div>

          {/* Conversation Feed */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              marginBottom: "1rem",
              maxHeight: "480px",
            }}
          >
            {aiMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "0.85rem 1.15rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    backgroundColor: m.role === "user" ? "var(--accent-primary)" : "var(--bg-surface)",
                    color: m.role === "user" ? "#FFFFFF" : "var(--text-primary)",
                    border: m.role === "user" ? "none" : "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.content}
                </div>

                {/* Prompt chips */}
                {m.suggested_prompts && m.suggested_prompts.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem", maxWidth: "85%" }}>
                    {m.suggested_prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleAiSend(p)}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: "0.775rem", borderRadius: "15px" }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {aiLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <Sparkles size={16} className="spin" color="var(--accent-primary)" />
                <span>Formulating personalized study and retention advice...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Ask UDAAN AI about GPA thresholds, timetable strategies, or coursework concepts..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAiSend()}
              disabled={aiLoading}
              className="form-input"
              style={{ fontSize: "0.9rem", padding: "0.75rem 1rem" }}
            />
            <button
              onClick={() => handleAiSend()}
              disabled={aiLoading || !aiInput.trim()}
              className="btn btn-primary"
              style={{ padding: "0.75rem 1.25rem" }}
            >
              <Send size={16} />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
