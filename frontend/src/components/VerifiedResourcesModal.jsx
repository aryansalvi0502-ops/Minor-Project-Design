import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Modal } from "./Modal";
import {
  BookOpen,
  ExternalLink,
  Star,
  CheckCircle,
  Search,
  Filter,
  Sparkles,
  MessageSquare,
  Award,
  Clock,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export function VerifiedResourcesModal({ isOpen, onClose }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  // Feedback state
  const [feedbackResource, setFeedbackResource] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [isHelpful, setIsHelpful] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await api.recovery.getLearningResources();
      setResources(data || []);
    } catch (err) {
      console.error("Failed to load learning resources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadResources();
    }
  }, [isOpen]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackResource) return;
    try {
      setSubmittingFeedback(true);
      await api.support.submitFeedback({
        target_type: "resource",
        target_id: feedbackResource.id,
        rating: feedbackRating,
        feedback_text: feedbackText,
        is_helpful: isHelpful,
      });
      setFeedbackSuccess(`Thank you! Your feedback for "${feedbackResource.title}" was recorded.`);
      setTimeout(() => {
        setFeedbackResource(null);
        setFeedbackSuccess("");
        setFeedbackText("");
      }, 2500);
    } catch (err) {
      alert("Failed to submit feedback: " + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subject_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "all" || res.department === selectedDept || !res.department;
    return matchesSearch && matchesDept;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verified Academic Learning Resources">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Intro */}
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
          Peer-reviewed and faculty-curated learning materials from global institutions (MIT OCW, Khan Academy, NPTEL) tailored to support remediation in core concepts.
        </p>

        {/* Filter / Search Bar */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by subject, topic or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="form-select"
            style={{ width: "auto", fontSize: "0.85rem" }}
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="General Engineering">General / Foundational</option>
          </select>
        </div>

        {/* Resources List */}
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading verified materials...
          </div>
        ) : filteredResources.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No verified resources match your search filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "420px", overflowY: "auto" }}>
            {filteredResources.map((res) => (
              <div
                key={res.id}
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  transition: "all var(--transition-fast)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                          color: "var(--accent-primary)",
                        }}
                      >
                        {res.provider}
                      </span>
                      {res.subject_code && (
                        <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {res.subject_code}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginTop: "0.25rem" }}>
                      {res.title}
                    </div>
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>Access Resource</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                {res.description && (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                    {res.description}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "0.5rem",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <span>Difficulty: <strong>{res.difficulty_level || "Introductory"}</strong></span>
                    {res.estimated_minutes && (
                      <span>Time: <strong>{Math.round(res.estimated_minutes / 60)} hrs</strong></span>
                    )}
                  </div>

                  <button
                    onClick={() => setFeedbackResource(res)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-primary)",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>Rate / Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Sub-Modal */}
        {feedbackResource && (
          <Modal
            isOpen={!!feedbackResource}
            onClose={() => setFeedbackResource(null)}
            title={`Rate Resource: ${feedbackResource.title}`}
          >
            {feedbackSuccess ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--accent-primary)" }}>
                <CheckCircle size={36} style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ fontWeight: 700 }}>{feedbackSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  Help advisors and future students by rating whether this verified material helped you grasp difficult concepts.
                </p>

                <div className="form-group">
                  <label className="form-label">Quality & Clarity Rating (1 to 5 Stars)</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          color: star <= feedbackRating ? "#F59E0B" : "var(--border-subtle)",
                        }}
                      >
                        <Star size={24} fill={star <= feedbackRating ? "#F59E0B" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Did this resource help you understand the concept?</label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => setIsHelpful(true)}
                      className={`btn btn-sm ${isHelpful ? "btn-primary" : "btn-secondary"}`}
                    >
                      <ThumbsUp size={14} />
                      <span>Yes, it helped</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHelpful(false)}
                      className={`btn btn-sm ${!isHelpful ? "btn-primary" : "btn-secondary"}`}
                    >
                      <ThumbsDown size={14} />
                      <span>Not enough</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Comments & Constructive Feedback (Optional)</label>
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share what parts were clearest or where more examples are needed..."
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                  <button
                    type="button"
                    onClick={() => setFeedbackResource(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="btn btn-primary"
                  >
                    <span>{submittingFeedback ? "Submitting..." : "Submit Review"}</span>
                  </button>
                </div>
              </form>
            )}
          </Modal>
        )}
      </div>
    </Modal>
  );
}
