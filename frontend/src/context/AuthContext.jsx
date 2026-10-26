import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      return saved && saved !== "undefined" && saved !== "null" ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Failed to parse cached auth_user:", e);
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("auth_token") || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const me = await api.auth.getMe();
          if (me && me.id) {
            setUser(me);
            localStorage.setItem("auth_user", JSON.stringify(me));
          } else {
            throw new Error("Invalid profile payload");
          }
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    loadUser();

    const handleAuthChange = () => {
      const currentToken = localStorage.getItem("auth_token");
      if (!currentToken) {
        setUser(null);
        setToken(null);
      }
    };
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, [token]);

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error("Please provide both your institutional email and password.");
    }

    const data = await api.auth.login({ email: email.trim(), password });
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response received from authentication server.");
    }

    const accessToken = data.access_token || data.token || data.data?.access_token;
    if (!accessToken) {
      const errMsg = data.detail || data.message || "Authentication failed: No access token returned.";
      throw new Error(errMsg);
    }

    let authUser = data.user || data.data?.user;
    localStorage.setItem("auth_token", accessToken);

    if (!authUser) {
      // Fallback: fetch current user profile with the new token
      try {
        authUser = await api.auth.getMe();
      } catch (profileErr) {
        console.warn("Could not fetch user profile after login:", profileErr);
      }
    }

    if (authUser) {
      localStorage.setItem("auth_user", JSON.stringify(authUser));
      setUser(authUser);
    }
    setToken(accessToken);

    return authUser || { email };
  };

  const register = async (userData) => {
    const newUser = await api.auth.register(userData);
    // Auto-login after registration
    return await login(userData.email, userData.password);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
