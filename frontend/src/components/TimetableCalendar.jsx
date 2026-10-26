import React, { useState } from "react";
import { Calendar, Clock, BookOpen } from "lucide-react";

export function TimetableCalendar({ timetable = {} }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [selectedDay, setSelectedDay] = useState("Monday");

  if (!timetable || Object.keys(timetable).length === 0) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        Timetable schedule template is not available yet.
      </div>
    );
  }

  const activeSlots = timetable[selectedDay] || [];

  return (
    <div>
      {/* Day Selector Pills */}
      <div
        style={{
          display: "flex",
          gap: "0.35rem",
          overflowX: "auto",
          paddingBottom: "0.75rem",
          marginBottom: "1rem",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {days.map((day) => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="btn btn-sm"
              style={{
                backgroundColor: isSelected ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: isSelected ? "#FFFFFF" : "var(--text-primary)",
                border: isSelected ? "none" : "1px solid var(--border-subtle)",
                fontWeight: isSelected ? "700" : "500",
                whiteSpace: "nowrap",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selected Day Agenda */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {activeSlots.length === 0 ? (
          <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
            Rest and unstructured revision day.
          </div>
        ) : (
          activeSlots.map((slot, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                background: "var(--bg-subtle)",
                borderLeft: "4px solid var(--accent-primary)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Clock size={16} color="var(--accent-primary)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {slot.activity}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {slot.subject}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  background: "var(--bg-surface)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {slot.time}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
