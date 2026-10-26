import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    return localStorage.getItem("theme_preference") || "system";
  });

  const [activeTheme, setActiveTheme] = useState("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const computeTheme = (pref) => {
      if (pref === "system") {
        return mediaQuery.matches ? "dark" : "light";
      }
      return pref;
    };

    const resolved = computeTheme(preference);
    setActiveTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem("theme_preference", preference);

    const handleMediaChange = (e) => {
      if (preference === "system") {
        const newTheme = e.matches ? "dark" : "light";
        setActiveTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, [preference]);

  return (
    <ThemeContext.Provider value={{ preference, setPreference, activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
