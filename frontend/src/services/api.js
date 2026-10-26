/**
 * Determine the backend API Base URL:
 * 1. Read VITE_API_BASE_URL (standard) or VITE_API_URL (backward compatibility).
 * 2. Sanitize trailing slashes and ensure /api/v1 suffix is present.
 * 3. In deployed environments (non-localhost/127.0.0.1), NEVER fall back to localhost or 127.0.0.1.
 * 4. Fall back to local development URL (http://127.0.0.1:8000/api/v1) strictly when running locally.
 */
export function getApiBase() {
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ""
  ).trim();

  if (envUrl) {
    let clean = envUrl.replace(/\/+$/, "");
    if (!clean.endsWith("/api/v1")) {
      if (clean.endsWith("/api")) {
        clean = `${clean}/v1`;
      } else {
        clean = `${clean}/api/v1`;
      }
    }
    return clean;
  }

  // Deployed production environment check
  const isBrowser = typeof window !== "undefined";
  const hostname = isBrowser ? window.location.hostname : "";
  const isLocalHost = !isBrowser || (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  );

  if (!isLocalHost) {
    // In production deployed frontend, NEVER use localhost / 127.0.0.1
    return "";
  }

  // Local development fallback only
  return "http://127.0.0.1:8000/api/v1";
}

const API_BASE = getApiBase();

function formatErrorMessage(data, status) {
  if (!data) {
    if (status === 401) return "Session expired or invalid credentials. Please sign in again.";
    if (status === 403) return "Access denied. You do not have permission to perform this action.";
    if (status === 404) return "Requested resource was not found on the server.";
    if (status === 502 || status === 503 || status === 504) {
      return "Backend service is currently waking up or temporarily unavailable. Please retry in a few moments.";
    }
    if (status >= 500) return `Server error (HTTP ${status}). Please try again later or contact your administrator.`;
    return `Server responded with HTTP ${status}.`;
  }

  if (data.detail) {
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((err) => {
          const loc = Array.isArray(err.loc)
            ? err.loc.filter((part) => part !== "body").join(".")
            : "";
          return loc ? `${loc}: ${err.msg}` : err.msg;
        })
        .join("; ");
    }
    if (typeof data.detail === "object") {
      return data.detail.message || data.detail.msg || JSON.stringify(data.detail);
    }
  }

  if (data.message && typeof data.message === "string") {
    return data.message;
  }

  return `Request failed with HTTP ${status}.`;
}

function getStoredToken() {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
  } catch {
    return null;
  }
}

function clearStoredAuth() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-changed"));
    }
  } catch {
    // ignore
  }
}

async function request(endpoint, options = {}) {
  const currentApiBase = getApiBase();

  if (!currentApiBase) {
    throw new Error(
      "Backend API URL is not configured. Please set the VITE_API_BASE_URL environment variable in your Vercel project settings to your deployed backend URL (e.g. https://your-backend.onrender.com/api/v1) and trigger a redeployment."
    );
  }

  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${currentApiBase}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    const isLocal = currentApiBase.includes("127.0.0.1") || currentApiBase.includes("localhost");
    if (isLocal) {
      throw new Error(`Unable to connect to local server at ${currentApiBase}. Please ensure your FastAPI backend is running locally.`);
    } else {
      throw new Error(
        `Unable to reach backend service at ${currentApiBase}. If your backend is hosted on a free cloud tier (such as Render), it may take 30–50 seconds to wake up from idle. Please wait a moment and try again.`
      );
    }
  }

  if (response.status === 401 && !endpoint.includes("/auth/login")) {
    // Unauthorized on a protected route: clear stale token
    clearStoredAuth();
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = formatErrorMessage(data, response.status);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function normalizeLearningGaps(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.critical_concept_gaps)) return data.critical_concept_gaps;
  if (Array.isArray(data.student_gaps)) return data.student_gaps;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.gaps)) return data.gaps;
  if (Array.isArray(data.subjects_summary)) {
    const extracted = [];
    data.subjects_summary.forEach((sub) => {
      if (Array.isArray(sub.weak_topics) && sub.weak_topics.length > 0) {
        sub.weak_topics.forEach((topic) => {
          extracted.push({
            subject_code: sub.subject_code,
            subject_name: sub.subject_name,
            topic: topic,
            concept_area: topic,
            average_score: sub.overall_percentage,
            average_percentage: sub.overall_percentage,
            severity: sub.mastery_status,
            gap_severity: sub.mastery_status,
            recommended_action: `Review core concepts in ${sub.subject_code}`,
            remediation_recommendation: `Review core concepts in ${sub.subject_code}`,
          });
        });
      }
    });
    if (extracted.length > 0) return extracted;
  }
  return [];
}

export const api = {
  normalizeLearningGaps,
  // Authentication
  auth: {
    login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
    register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
    getMe: () => request("/auth/me"),
  },

  // Student Profiles & Subject Marks
  profiles: {
    getMyProfile: () => request("/profiles/me"),
    createProfile: (profileData) => request("/profiles/", { method: "POST", body: JSON.stringify(profileData) }),
    updateMyProfile: (profileData) => request("/profiles/me", { method: "PUT", body: JSON.stringify(profileData) }),
    getProfileById: (id) => request(`/profiles/${id}`),
    getMyLearningGaps: () => request("/profiles/me/learning-gaps"),
    getMySubjectMarks: () => request("/profiles/me/subject-marks"),
    addSubjectMark: (data) => request("/profiles/me/subject-marks", { method: "POST", body: JSON.stringify(data) }),
  },

  // Predictions, Explainability, Trends & What-If Simulator
  predictions: {
    getMyLatest: () => request("/predictions/latest"),
    getStudentPrediction: (profileId) => request(`/predictions/student/${profileId}`),
    getMyHistory: () => request("/predictions/history"),
    getTrends: () => request("/predictions/trends"),
    getModelCard: () => request("/predictions/model-card"),
    simulateGpa: (data) => request("/predictions/simulate-gpa", { method: "POST", body: JSON.stringify(data) }),
    simulateWhatIf: (data) => request("/predictions/simulate-what-if", { method: "POST", body: JSON.stringify(data) }),
  },

  // Personalized Recovery Plans, Prioritized Actions, Adaptive Timetable & Resources
  recovery: {
    getActivePlan: () => request("/recovery/current"),
    toggleTask: (taskId, isCompleted) =>
      request(`/recovery/tasks/${taskId}/toggle`, {
        method: "PUT",
        body: JSON.stringify({ is_completed: isCompleted }),
      }),
    getPrioritizedActions: () => request("/recovery/prioritized-actions"),
    getAdaptiveTimetable: () => request("/recovery/timetable"),
    updateTimetableConfig: (data) =>
      request("/recovery/timetable/config", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    addDeadline: (data) =>
      request("/recovery/timetable/deadlines", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    toggleDeadline: (deadlineId) =>
      request(`/recovery/timetable/deadlines/${deadlineId}/toggle`, {
        method: "PATCH",
      }),
    deleteDeadline: (deadlineId) =>
      request(`/recovery/timetable/deadlines/${deadlineId}`, {
        method: "DELETE",
      }),
    getLearningResources: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.append(k, v);
      });
      const qs = searchParams.toString();
      return request(`/recovery/resources${qs ? `?${qs}` : ""}`);
    },
    updateTimetable: (timetable) =>
      request("/recovery/timetable", {
        method: "PUT",
        body: JSON.stringify(timetable),
      }),
    getStudentPlan: (profileId) => request(`/recovery/student/${profileId}`),
  },

  // Faculty Advisor Workflows
  advisor: {
    getAssignedStudents: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") searchParams.append(k, v);
      });
      const qs = searchParams.toString();
      return request(`/advisor/assigned-students${qs ? `?${qs}` : ""}`);
    },
    createIntervention: (data) => request("/advisor/interventions", { method: "POST", body: JSON.stringify(data) }),
    updateIntervention: (id, data) => request(`/advisor/interventions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    confirmAppointment: (id, data) => request(`/advisor/appointments/${id}/confirm`, { method: "PATCH", body: JSON.stringify(data) }),
    completeAppointment: (id, data) => request(`/advisor/appointments/${id}/complete`, { method: "PATCH", body: JSON.stringify(data) }),
    getStudentLearningGaps: (studentProfileId) => request(`/advisor/students/${studentProfileId}/learning-gaps`),
    getFeedbackSummary: () => request("/advisor/feedback-summary"),
    listInterventions: (studentId) =>
      request(studentId ? `/advisor/interventions?student_id=${studentId}` : "/advisor/interventions"),
  },

  // Management Analytics
  analytics: {
    getOverview: () => request("/analytics/overview"),
  },

  // Administration & Governance
  admin: {
    getHealth: () => request("/admin/system-health"),
    listUsers: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.append(k, v);
      });
      const qs = searchParams.toString();
      return request(`/admin/users${qs ? `?${qs}` : ""}`);
    },
    updateUserRole: (userId, role) =>
      request(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    toggleUserStatus: (userId, isActive) =>
      request(`/admin/users/${userId}/status?is_active=${isActive}`, {
        method: "PUT",
      }),
    getAuditLogs: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.append(k, v);
      });
      const qs = searchParams.toString();
      return request(`/admin/audit-logs${qs ? `?${qs}` : ""}`);
    },
    retrainModel: (data = {}) =>
      request("/admin/retrain", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateThresholds: (thresholds) =>
      request("/admin/thresholds", {
        method: "PUT",
        body: JSON.stringify(thresholds),
      }),
  },

  // In-App Notifications, Preferences & Configurable Reminders
  notifications: {
    getAll: () => request("/notifications/"),
    markRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
    markAllRead: () => request("/notifications/mark-all-read", { method: "PUT" }),
    getPreferences: () => request("/notifications/preferences"),
    updatePreferences: (data) =>
      request("/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    getReminders: () => request("/notifications/reminders"),
    createReminder: (data) =>
      request("/notifications/reminders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    toggleReminder: (id) =>
      request(`/notifications/reminders/${id}/toggle`, {
        method: "PATCH",
      }),
    deleteReminder: (id) =>
      request(`/notifications/reminders/${id}`, {
        method: "DELETE",
      }),
  },

  // Student Support Systems & Student Feedback
  support: {
    chat: (message, history = []) =>
      request("/support/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
      }),
    getAdvisorInfo: () => request("/support/advisor-info"),
    requestHumanSupport: (data) =>
      request("/support/request-human-support", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getMyTickets: () => request("/support/my-tickets"),
    submitFeedback: (data) =>
      request("/support/feedback", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getMyFeedback: () => request("/support/feedback/my-feedback"),
  },

  // MITAOE Curriculum & Enrollments
  curriculum: {
    getPrograms: () => request("/curriculum/programs"),
    getCourses: (params = {}) => {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") sp.append(k, v);
      });
      const qs = sp.toString();
      return request(`/curriculum/courses${qs ? `?${qs}` : ""}`);
    },
    getMyEnrollments: () => request("/curriculum/my-enrollments"),
    saveEnrollment: (data) =>
      request("/curriculum/my-enrollments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    batchSaveEnrollments: (list) =>
      request("/curriculum/my-enrollments/batch", {
        method: "POST",
        body: JSON.stringify(list),
      }),
    updateEnrollment: (id, data) =>
      request(`/curriculum/my-enrollments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteEnrollment: (id) =>
      request(`/curriculum/my-enrollments/${id}`, {
        method: "DELETE",
      }),
    adminImportCourses: (data) =>
      request("/curriculum/admin/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
