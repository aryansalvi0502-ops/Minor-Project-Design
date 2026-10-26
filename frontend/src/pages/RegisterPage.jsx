import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { UserPlus, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

export function RegisterPage({ setActivePage }) {
  const { register } = useAuth();
  const [step, setStep] = useState(1); // 1 = Account Credentials, 2 = Academic Profile Features
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Account details
  const [account, setAccount] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "CS",
  });

  // Profile details (features matching training model)
  const [profile, setProfile] = useState({
    student_institutional_id: `STU-${Math.floor(10000 + Math.random() * 90000)}`,
    department: "CS",
    semester: "Year 1",
    age: 20,
    gender: "Female",
    family_income: 35000,
    internet_access: "Yes",
    study_hours_per_day: 3.5,
    attendance_rate: 85,
    assignment_delay_days: 1,
    travel_time_minutes: 25,
    part_time_job: "No",
    scholarship: "No",
    stress_index: 5.0,
    gpa: 7.5,
    semester_gpa: 7.5,
    cgpa: 7.5,
    parental_education: "Bachelor",
  });

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (!account.fullName || !account.email || !account.password) {
      setError("Please fill in all account fields.");
      return;
    }
    setError("");
    setProfile((prev) => ({ ...prev, department: account.department }));
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Register User & auto-login
      await register({
        email: account.email,
        full_name: account.fullName,
        password: account.password,
        role: "student",
        department: account.department,
      });

      // 2. Create Student Profile (triggers initial prediction & recovery plan)
      await api.profiles.createProfile({
        student_institutional_id: profile.student_institutional_id,
        department: profile.department,
        semester: profile.semester,
        age: Number(profile.age),
        gender: profile.gender,
        family_income: Number(profile.family_income),
        internet_access: profile.internet_access,
        study_hours_per_day: Number(profile.study_hours_per_day),
        attendance_rate: Number(profile.attendance_rate),
        assignment_delay_days: Number(profile.assignment_delay_days),
        travel_time_minutes: Number(profile.travel_time_minutes),
        part_time_job: profile.part_time_job,
        scholarship: profile.scholarship,
        stress_index: Number(profile.stress_index),
        gpa: Number(profile.gpa),
        semester_gpa: Number(profile.semester_gpa),
        cgpa: Number(profile.cgpa),
        parental_education: profile.parental_education,
      });

      setActivePage("dashboard");
    } catch (err) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "640px", margin: "2rem auto", padding: "0 1rem" }}>
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
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800 }}>Student Registration</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Step {step} of 2: {step === 1 ? "Account Credentials" : "Academic Profile & Verified Attributes"}
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

        {step === 1 ? (
          <form onSubmit={handleAccountSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Legal Name</label>
              <input
                id="fullName"
                type="text"
                required
                value={account.fullName}
                onChange={(e) => setAccount({ ...account, fullName: e.target.value })}
                placeholder="Jane Doe"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Institutional Email</label>
              <input
                id="email"
                type="email"
                required
                value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })}
                placeholder="j.doe@university.edu"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password (Minimum 8 Characters)</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={account.password}
                onChange={(e) => setAccount({ ...account, password: e.target.value })}
                placeholder="••••••••"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dept">Department</label>
              <select
                id="dept"
                value={account.department}
                onChange={(e) => setAccount({ ...account, department: e.target.value })}
                className="form-select"
              >
                <option value="CS">Computer Science (CS)</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Science">Natural Sciences</option>
                <option value="Arts">Humanities & Arts</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "1rem", padding: "0.75rem" }}
            >
              <span>Continue to Academic Profile</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Student Institutional ID</label>
                <input
                  type="text"
                  required
                  value={profile.student_institutional_id}
                  onChange={(e) => setProfile({ ...profile, student_institutional_id: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Academic Level / Year</label>
                <select
                  value={profile.semester}
                  onChange={(e) => setProfile({ ...profile, semester: e.target.value })}
                  className="form-select"
                >
                  <option value="Year 1">Year 1 (Freshman)</option>
                  <option value="Year 2">Year 2 (Sophomore)</option>
                  <option value="Year 3">Year 3 (Junior)</option>
                  <option value="Year 4">Year 4 (Senior)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Cumulative GPA (0.0 - 10.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10.0"
                  required
                  value={profile.gpa}
                  onChange={(e) => setProfile({ ...profile, gpa: e.target.value, cgpa: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Latest Semester GPA (0.0 - 10.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10.0"
                  required
                  value={profile.semester_gpa}
                  onChange={(e) => setProfile({ ...profile, semester_gpa: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lecture Attendance Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={profile.attendance_rate}
                  onChange={(e) => setProfile({ ...profile, attendance_rate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Daily Study Hours (Hrs/Day)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  required
                  value={profile.study_hours_per_day}
                  onChange={(e) => setProfile({ ...profile, study_hours_per_day: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Average Assignment Delay (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  required
                  value={profile.assignment_delay_days}
                  onChange={(e) => setProfile({ ...profile, assignment_delay_days: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Self-Reported Stress (1 - 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  required
                  value={profile.stress_index}
                  onChange={(e) => setProfile({ ...profile, stress_index: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                <span>{loading ? "Generating Evaluation..." : "Complete & Generate Risk Plan"}</span>
                <CheckCircle2 size={16} />
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <button
            onClick={() => setActivePage("login")}
            style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "underline" }}
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
}
