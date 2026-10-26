import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, Key, Mail, ShieldAlert, ArrowRight, UserCheck } from "lucide-react";

export function LoginPage({ setActivePage }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      // Route to appropriate initial dashboard based on role
      const role = user?.role || "student";
      if (role === "student") setActivePage("dashboard");
      else if (role === "advisor") setActivePage("advisor");
      else if (role === "management") setActivePage("management");
      else if (role === "admin") setActivePage("admin");
      else setActivePage("dashboard");
    } catch (err) {
      setError(err.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setLoading(true);
    try {
      const user = await login(demoEmail, demoPassword);
      const role = user?.role || "student";
      if (role === "student") setActivePage("dashboard");
      else if (role === "advisor") setActivePage("advisor");
      else if (role === "management") setActivePage("management");
      else if (role === "admin") setActivePage("admin");
      else setActivePage("dashboard");
    } catch (err) {
      setError(err.message || "Failed to authenticate with demo account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "460px", margin: "2rem auto", padding: "0 1rem" }}>
      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-primary)",
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.75rem",
            }}
          >
            <LogIn size={24} />
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800 }}>Sign In to UDAAN</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Student Success & Early-Warning Portal
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              background: "var(--risk-high-bg)",
              border: "1px solid var(--risk-high-border)",
              color: "var(--risk-high-text)",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Institutional Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem" }}
          >
            <span>{loading ? "Authenticating..." : "Sign In"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ margin: "1.5rem 0 1rem", textAlign: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
          <span style={{ fontSize: "0.775rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            Quick Demo Accounts (1-Click Login)
          </span>
        </div>

        {/* Quick Demo Credentials */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => handleQuickLogin("student@university.edu", "StudentPass123!")}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: "0.775rem", justifyContent: "flex-start" }}
          >
            <UserCheck size={14} color="var(--accent-primary)" />
            <span>Student (Alex)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("advisor@university.edu", "AdvisorPass123!")}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: "0.775rem", justifyContent: "flex-start" }}
          >
            <UserCheck size={14} color="var(--risk-medium-accent)" />
            <span>Faculty Advisor</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("management@university.edu", "ManagePass123!")}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: "0.775rem", justifyContent: "flex-start" }}
          >
            <UserCheck size={14} />
            <span>Management</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("admin@university.edu", "AdminPass123!")}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: "0.775rem", justifyContent: "flex-start" }}
          >
            <UserCheck size={14} color="var(--risk-high-accent)" />
            <span>Administrator</span>
          </button>
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <button
            onClick={() => setActivePage("register")}
            style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "underline" }}
          >
            Register Student Profile
          </button>
        </div>
      </div>
    </div>
  );
}
