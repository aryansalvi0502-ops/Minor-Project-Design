import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { preference, setPreference, activeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ];

  const CurrentIcon =
    preference === "system"
      ? Laptop
      : activeTheme === "dark"
      ? Moon
      : Sun;

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        aria-label="Toggle display theme preference"
        style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
      >
        <CurrentIcon size={16} />
        <span style={{ textTransform: "capitalize", fontSize: "0.8rem" }}>
          {preference}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: "0.5rem",
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            minWidth: "120px",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = preference === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setPreference(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  fontSize: "0.85rem",
                  color: isSelected ? "var(--accent-primary)" : "var(--text-primary)",
                  backgroundColor: isSelected ? "var(--accent-primary-subtle)" : "transparent",
                  fontWeight: isSelected ? "700" : "500",
                  textAlign: "left",
                }}
              >
                <Icon size={15} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
