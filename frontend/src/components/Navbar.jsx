import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationDrawer } from "./NotificationDrawer";
import {
  GraduationCap,
  Bell,
  LogOut,
  User,
  Shield,
  BarChart3,
  BookOpen,
  Settings,
  Users,
  Compass,
} from "lucide-react";

export function Navbar({ activePage, setActivePage }) {
  const { user, isAuthenticated, logout, role } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 500,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => setActivePage(isAuthenticated ? "dashboard" : "landing")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-primary)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={22} />
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: "1.15rem", letterSpacing: "0.05em", color: "var(--accent-primary)" }}>
              UDAAN
            </span>
            <span style={{ display: "block", fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 600, marginTop: "-2px" }}>
              Student Success & Early-Warning
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => setActivePage("landing")}
                className={`btn btn-sm ${activePage === "landing" ? "btn-secondary" : ""}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActivePage("model-card")}
                className={`btn btn-sm ${activePage === "model-card" ? "btn-secondary" : ""}`}
              >
                Model Card
              </button>
              <button
                onClick={() => setActivePage("ethics")}
                className={`btn btn-sm ${activePage === "ethics" ? "btn-secondary" : ""}`}
              >
                Responsible Use
              </button>
              <button
                onClick={() => setActivePage("privacy")}
                className={`btn btn-sm ${activePage === "privacy" ? "btn-secondary" : ""}`}
              >
                Privacy & Data
              </button>
              <button
                onClick={() => setActivePage("login")}
                className={`btn btn-sm ${activePage === "login" ? "btn-primary" : "btn-secondary"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActivePage("register")}
                className="btn btn-sm btn-primary"
              >
                Register
              </button>
            </>
          ) : (
            <>
              {role === "student" && (
                <>
                  <button
                    onClick={() => setActivePage("dashboard")}
                    className={`btn btn-sm ${activePage === "dashboard" ? "btn-secondary" : ""}`}
                  >
                    My Dashboard
                  </button>
                  <button
                    onClick={() => setActivePage("profile")}
                    className={`btn btn-sm ${activePage === "profile" ? "btn-secondary" : ""}`}
                  >
                    Academic Profile
                  </button>
                  <button
                    onClick={() => setActivePage("recovery-plan")}
                    className={`btn btn-sm ${activePage === "recovery-plan" ? "btn-secondary" : ""}`}
                  >
                    Recovery Plan
                  </button>
                  <button
                    onClick={() => setActivePage("support")}
                    className={`btn btn-sm ${activePage === "support" ? "btn-secondary" : ""}`}
                  >
                    Support Hub
                  </button>
                  <button
                    onClick={() => setActivePage("privacy")}
                    className={`btn btn-sm ${activePage === "privacy" ? "btn-secondary" : ""}`}
                  >
                    Privacy
                  </button>
                </>
              )}

              {role === "advisor" && (
                <>
                  <button
                    onClick={() => setActivePage("advisor")}
                    className={`btn btn-sm ${activePage === "advisor" ? "btn-secondary" : ""}`}
                  >
                    Assigned Cohort
                  </button>
                  <button
                    onClick={() => setActivePage("model-card")}
                    className={`btn btn-sm ${activePage === "model-card" ? "btn-secondary" : ""}`}
                  >
                    Model Transparency
                  </button>
                </>
              )}

              {role === "management" && (
                <>
                  <button
                    onClick={() => setActivePage("management")}
                    className={`btn btn-sm ${activePage === "management" ? "btn-secondary" : ""}`}
                  >
                    Analytics & Trends
                  </button>
                  <button
                    onClick={() => setActivePage("model-card")}
                    className={`btn btn-sm ${activePage === "model-card" ? "btn-secondary" : ""}`}
                  >
                    Model Performance
                  </button>
                </>
              )}

              {role === "admin" && (
                <>
                  <button
                    onClick={() => setActivePage("admin")}
                    className={`btn btn-sm ${activePage === "admin" ? "btn-secondary" : ""}`}
                  >
                    System Governance
                  </button>
                  <button
                    onClick={() => setActivePage("management")}
                    className={`btn btn-sm ${activePage === "management" ? "btn-secondary" : ""}`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setActivePage("model-card")}
                    className={`btn btn-sm ${activePage === "model-card" ? "btn-secondary" : ""}`}
                  >
                    Model Card
                  </button>
                </>
              )}
            </>
          )}
        </nav>

        {/* Right Controls: Notifications, ThemeToggle, User Chip */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isAuthenticated && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn-icon"
                aria-label="View In-App Notifications"
                style={{ position: "relative" }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--risk-high-accent)",
                    }}
                  />
                )}
              </button>
              <NotificationDrawer
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>
          )}

          <ThemeToggle />

          {isAuthenticated && user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.3rem 0.6rem",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <User size={14} color="var(--accent-primary)" />
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{user?.full_name || "Profile unavailable"}</span>
                <span
                  className="badge badge-neutral"
                  style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", textTransform: "uppercase" }}
                >
                  {role}
                </span>
              </div>

              <button
                onClick={logout}
                className="btn-icon"
                title="Sign out of account"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
