import React, { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { ProfilePage } from "./pages/ProfilePage";
import { RecoveryPlanPage } from "./pages/RecoveryPlanPage";
import { AdvisorDashboard } from "./pages/AdvisorDashboard";
import { ManagementDashboard } from "./pages/ManagementDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ModelCardPage } from "./pages/ModelCardPage";
import { ResponsibleUsePage } from "./pages/ResponsibleUsePage";
import { PrivacyTransparencyPage } from "./pages/PrivacyTransparencyPage";
import { SupportPage } from "./pages/SupportPage";
import { AIChatWidget } from "./components/AIChatWidget";

function AppContent() {
  const { user, isAuthenticated, role, loading } = useAuth();
  const [activePage, setActivePage] = useState(() => {
    return isAuthenticated ? "dashboard" : "landing";
  });

  // Loading state while checking token
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "var(--bg-app)",
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid var(--border-subtle)",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ fontSize: "0.9rem" }}>Loading portal workspace...</p>
      </div>
    );
  }

  // Resolve page based on auth state
  const renderPage = () => {
    if (!isAuthenticated) {
      if (activePage === "login") return <LoginPage setActivePage={setActivePage} />;
      if (activePage === "register") return <RegisterPage setActivePage={setActivePage} />;
      if (activePage === "model-card") return <ModelCardPage setActivePage={setActivePage} />;
      if (activePage === "ethics") return <ResponsibleUsePage setActivePage={setActivePage} />;
      if (activePage === "privacy") return <PrivacyTransparencyPage setActivePage={setActivePage} />;
      return <LandingPage setActivePage={setActivePage} />;
    }

    // Role-specific routing
    switch (activePage) {
      case "profile":
        return <ProfilePage setActivePage={setActivePage} />;
      case "recovery-plan":
        return <RecoveryPlanPage setActivePage={setActivePage} />;
      case "support":
        return <SupportPage setActivePage={setActivePage} />;
      case "privacy":
        return <PrivacyTransparencyPage setActivePage={setActivePage} />;
      case "advisor":
        return <AdvisorDashboard setActivePage={setActivePage} />;
      case "management":
        return <ManagementDashboard setActivePage={setActivePage} />;
      case "admin":
        return <AdminDashboard setActivePage={setActivePage} />;
      case "model-card":
        return <ModelCardPage setActivePage={setActivePage} />;
      case "ethics":
        return <ResponsibleUsePage setActivePage={setActivePage} />;
      case "dashboard":
      default:
        if (role === "advisor") return <AdvisorDashboard setActivePage={setActivePage} />;
        if (role === "management") return <ManagementDashboard setActivePage={setActivePage} />;
        if (role === "admin") return <AdminDashboard setActivePage={setActivePage} />;
        return <StudentDashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-layout">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        <ErrorBoundary key={activePage + (role || "guest")}>
          {renderPage()}
        </ErrorBoundary>
      </main>

      {/* Floating UDAAN AI Chatbot Widget (for authenticated students) */}
      <AIChatWidget setActivePage={setActivePage} />

      <footer
        style={{
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
          padding: "2rem 0",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}
      >
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <strong>UDAAN</strong> — Student Success & Early-Warning System | Explainable AI for Retention & Academic Recovery
          </div>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            <button onClick={() => setActivePage("privacy")} style={{ color: "inherit", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
              Privacy & AI Transparency
            </button>
            <button onClick={() => setActivePage("model-card")} style={{ color: "inherit", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
              Model Transparency Card
            </button>
            <button onClick={() => setActivePage("ethics")} style={{ color: "inherit", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
              Responsible AI Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

