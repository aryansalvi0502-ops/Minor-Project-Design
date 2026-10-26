import React, { useRef, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { Bell, Check, CheckCheck, Clock, AlertCircle } from "lucide-react";

export function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const drawerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: "0.5rem",
        width: "360px",
        maxHeight: "480px",
        background: "var(--bg-surface-elevated)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-elevated)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.85rem 1rem",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "0.9rem" }}>
          <Bell size={16} />
          <span>In-App Notifications</span>
          {unreadCount > 0 && (
            <span className="badge badge-high" style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem" }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "0.5rem" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No notifications at this time.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.is_read && markAsRead(item.id)}
              style={{
                padding: "0.75rem 0.85rem",
                borderRadius: "var(--radius-md)",
                marginBottom: "0.4rem",
                background: item.is_read ? "transparent" : "var(--accent-primary-subtle)",
                border: "1px solid var(--border-subtle)",
                cursor: item.is_read ? "default" : "pointer",
                transition: "background-color var(--transition-fast)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.2rem" }}>
                <span style={{ fontWeight: item.is_read ? 600 : 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                  {item.title}
                </span>
                {!item.is_read && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-primary)" }} />
                )}
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {item.message}
              </p>
              <div style={{ marginTop: "0.35rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
