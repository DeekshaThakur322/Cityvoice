import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../ApiClient/interceptor";
import {
  Megaphone,
  MapPin,
  Plus,
  LayoutDashboard,
  Ticket,
  Settings,
  LogOut,
  User as UserIcon,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
} from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 🔔 Notification States
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  // 🔔 Fetch Live Alerts Based on User Role
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get("/issues");
        const allIssues = res.data.data || [];
        let alerts = [];

        if (user.role === "official" || user.role === "admin") {
          // 🧑‍💼 OFFICIAL ALERTS: Escalated, Critical, or Pending Triage
          const urgentIssues = allIssues.filter(
            (i) => i.status === "Escalated" || i.priority === "Critical"
          );
          urgentIssues.slice(0, 5).forEach((iss) => {
            alerts.push({
              id: iss._id,
              type: "escalated",
              title: `⚠️ SLA Alert: ${iss.ticketId || "Issue"}`,
              desc: `${iss.title} requires urgent department attention.`,
              link: `/issue/${iss._id}`,
              time: iss.updatedAt || iss.createdAt,
            });
          });

          // Newly reported issues awaiting review
          const newIssues = allIssues.filter((i) => i.status === "Reported");
          newIssues.slice(0, 3).forEach((iss) => {
            alerts.push({
              id: iss._id,
              type: "new",
              title: `📢 New Report: ${iss.category}`,
              desc: `"${iss.title}" reported at ${iss.address || "your city"}.`,
              link: `/issue/${iss._id}`,
              time: iss.createdAt,
            });
          });
        } else {
          // 👤 CITIZEN ALERTS: Status updates on their own reported tickets
          const myIssues = allIssues.filter((i) => {
            const reporterId = i.reportedBy?._id || i.reportedBy;
            const currentUserId = user?.id || user?._id;
            return (
              (currentUserId && reporterId && reporterId.toString() === currentUserId.toString()) ||
              (user?.name && i.reportedBy?.name === user.name)
            );
          });

          myIssues.forEach((iss) => {
            if (iss.status === "Resolved") {
              alerts.push({
                id: iss._id,
                type: "resolved",
                title: `✅ Issue Fixed: ${iss.ticketId || "Ticket"}`,
                desc: `"${iss.title}" has been repaired! Click to verify & rate.`,
                link: `/issue/${iss._id}`,
                time: iss.updatedAt,
              });
            } else if (iss.status === "In-Progress") {
              alerts.push({
                id: iss._id,
                type: "progress",
                title: `🔧 Work Underway: ${iss.ticketId || "Ticket"}`,
                desc: `Ground team assigned to "${iss.title}".`,
                link: `/issue/${iss._id}`,
                time: iss.updatedAt,
              });
            }
          });
        }

        setNotifications(alerts);
        setUnreadCount(alerts.length);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    fetchNotifications();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAlertIcon = (type) => {
    switch (type) {
      case "escalated":
        return <AlertTriangle size={15} color="#dc2626" />;
      case "resolved":
        return <CheckCircle2 size={15} color="#16a34a" />;
      case "progress":
        return <Wrench size={15} color="#f59e0b" />;
      default:
        return <Clock size={15} color="#2563eb" />;
    }
  };

  return (
    <header className="top-navbar">
      {/* 1. Left: CityVoice Logo */}
      <Link to="/" className="top-nav-brand">
        <Megaphone size={22} color="#38bdf8" />
        <span className="brand-text">
          City<strong>Voice</strong>
        </span>
      </Link>

      {/* 2. Center: All Nav Links */}
      <div className="top-nav-left">
  <Link
    to="/"
    className={`top-nav-item ${location.pathname === "/" ? "active" : ""}`}
  >
    <MapPin size={16} />
    <span>Map & Feed</span>
  </Link>
{user && user.role === "citizen" && (
  <Link
    to="/report"
    className={`top-nav-item ${location.pathname === "/report" ? "active" : ""}`}
  >
    <Plus size={16} />
    <span>Report Issue</span>
  </Link>
)}
  <Link
    to="/dashboard"
    className={`top-nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
  >
    <LayoutDashboard size={16} />
    <span>Dashboard</span>
  </Link>

  <Link
    to="/my-tickets"
    className={`top-nav-item ${location.pathname === "/my-tickets" ? "active" : ""}`}
  >
    <Ticket size={16} />
    <span>My Tickets</span>
  </Link>

  <Link
    to="/settings"
    className={`top-nav-item ${location.pathname === "/settings" ? "active" : ""}`}
  >
    <Settings size={16} />
    <span>Settings</span>
  </Link>
</div>

      {/* 3. Right: Notifications & User Profile */}
      <div className="top-nav-right">
        {user ? (
          <div className="nav-user-container" style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            
            {/* 🔔 Interactive Notification Bell */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              
<button
  onClick={() => {
    setShowNotifications(!showNotifications);
    setUnreadCount(0);
  }}
  className={`notification-btn ${showNotifications ? "notification-active" : ""}`}
  title="Civic Notifications"
>
  <Bell size={18} />

  {unreadCount > 0 && (
    <span className="notification-badge">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  )}
</button>


              {/* 📬 Floating Notification Dropdown */}
              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "40px",
                    width: "320px",
                    background: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0,0,0,0.1)",
                    border: "1px solid #e2e8f0",
                    padding: "0.85rem",
                    zIndex: 9999,
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: "0.5rem",
                      marginBottom: "0.6rem",
                    }}
                  >
                    <span style={{ fontWeight: "800", fontSize: "0.85rem", color: "#0f172a" }}>
                      🔔 Civic Activity Alerts
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                      {notifications.length} alerts
                    </span>
                  </div>

                  <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#94a3b8", fontSize: "0.82rem" }}>
                        ✨ No active alerts right now!
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            navigate(n.link);
                          }}
                          style={{
                            padding: "0.6rem",
                            borderRadius: "8px",
                            background: "#f8fafc",
                            border: "1px solid #f1f5f9",
                            cursor: "pointer",
                            transition: "background 0.15s ease",
                            display: "flex",
                            gap: "0.6rem",
                            alignItems: "flex-start",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        >
                          <div style={{ marginTop: "2px" }}>{getAlertIcon(n.type)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#1e293b" }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px", lineHeight: "1.25" }}>
                              {n.desc}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="nav-user-badge">
              <div className="nav-user-text">
                <span className="nav-user-name">{user.name}</span>
                <span className="nav-user-role">{user.role?.toUpperCase()}</span>
              </div>
              <div className="nav-user-avatar">
                <UserIcon size={16} />
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn-logout"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/signin" className="btn-signin">Sign In</Link>
            <Link to="/signup" className="btn-signup">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;