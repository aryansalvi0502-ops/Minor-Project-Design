import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Maximize2,
} from "lucide-react";

export function AIChatWidget({ setActivePage }) {
  const { user, isAuthenticated, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am **UDAAN AI Assistant**, your personal academic retention mentor. I have access to your verified study profile, GPA standing, and early-warning metrics. How can I help you succeed today?",
      suggested_prompts: [
        "How do I raise my GPA above the 6.0 threshold?",
        "Why is my risk score at its current level?",
        "Help me build a personalized study schedule",
        "Connect me with my human faculty advisor",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalation, setEscalation] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Only render for authenticated students
  if (!isAuthenticated || role !== "student") {
    return null;
  }

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    try {
      // Pass clean history for context
      const chatHistory = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.support.chat(text, chatHistory);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          suggested_prompts: res.suggested_prompts || [],
        },
      ]);

      if (res.escalate_to_human) {
        setEscalation(res.escalation_reason || "Faculty consultation recommended");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered a temporary connection issue. Your academic record is safe! You can also connect directly with your faculty advisor via the Support Hub.",
          suggested_prompts: ["Schedule Advisor Meeting", "Try again"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 999,
            backgroundColor: "var(--accent-primary)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "50px",
            padding: "0.85rem 1.35rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.9rem",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          aria-label="Open UDAAN AI Chatbot"
        >
          <Sparkles size={18} />
          <span>Ask UDAAN AI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "420px",
            maxWidth: "calc(100vw - 32px)",
            height: "620px",
            maxHeight: "calc(100vh - 48px)",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "var(--bg-subtle)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-primary)",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
                  UDAAN AI Assistant
                </div>
                <div style={{ fontSize: "0.725rem", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-primary)" }} />
                  Context-Aware Academic AI
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (setActivePage) setActivePage("support");
                }}
                className="btn-icon"
                title="Open Full Support Hub"
                style={{ width: "28px", height: "28px" }}
              >
                <Maximize2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-icon"
                style={{ width: "28px", height: "28px" }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Escalation Banner */}
          {escalation && (
            <div
              style={{
                padding: "0.6rem 0.85rem",
                background: "var(--risk-high-bg)",
                borderBottom: "1px solid var(--risk-high-border)",
                color: "var(--risk-high-text)",
                fontSize: "0.775rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <AlertCircle size={14} />
                <span><strong>Faculty Referral:</strong> {escalation}</span>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (setActivePage) setActivePage("support");
                }}
                style={{
                  color: "inherit",
                  textDecoration: "underline",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Book Advisor
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              padding: "1rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {messages.map((m, idx) => (
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
                    maxWidth: "85%",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    backgroundColor:
                      m.role === "user" ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: m.role === "user" ? "#FFFFFF" : "var(--text-primary)",
                    border:
                      m.role === "user" ? "none" : "1px solid var(--border-subtle)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>

                {/* Suggested Follow-up Prompts */}
                {m.suggested_prompts && m.suggested_prompts.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.35rem",
                      marginTop: "0.5rem",
                      maxWidth: "90%",
                    }}
                  >
                    {m.suggested_prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSend(p)}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.3rem 0.6rem",
                          borderRadius: "15px",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "border-color 0.2s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.borderColor = "var(--accent-primary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.borderColor = "var(--border-subtle)")
                        }
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.8rem", padding: "0.5rem" }}>
                <Sparkles size={14} className="spin" />
                <span>UDAAN AI is formulating contextual advice...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--bg-surface)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Ask about GPA, timetable, study tips..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="form-input"
              style={{ fontSize: "0.85rem", padding: "0.6rem 0.85rem" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{ padding: "0.6rem 0.85rem" }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
