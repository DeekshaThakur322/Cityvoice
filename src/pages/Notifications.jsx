import React from "react";
import { Bell, ShieldAlert, CheckCircle2, Clock } from "lucide-react";

const Notifications = () => {
  return (
    <div className="dashboard-content-flow">
      <div className="skyline-banner">
        <div className="banner-text-content">
          <div className="banner-icon-badge">
            <Bell size={28} color="#2563eb" />
          </div>
          <div>
            <h2 className="banner-heading">Civic Alerts & Notifications</h2>
            <p className="banner-subheading">Real-time resolution updates, status changes, and municipal alerts.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="issue-card" style={{ borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ background: "#dcfce7", color: "#16a34a", padding: "0.6rem", borderRadius: "10px" }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: "1rem", fontWeight: "700" }}>Pothole Complaint Marked as Resolved!</h4>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.2rem 0" }}>Ticket CV-4051 was repaired and leveled by Road Crew Ward 12.</p>
              <small style={{ color: "#94a3b8" }}>10 minutes ago</small>
            </div>
          </div>
        </div>

        <div className="issue-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ background: "#fef3c7", color: "#d97706", padding: "0.6rem", borderRadius: "10px" }}>
              <Clock size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: "1rem", fontWeight: "700" }}>Broken Streetlight Status Changed to 'In-Progress'</h4>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.2rem 0" }}>Ticket CV-2597 assigned to Electrical Maintenance Unit.</p>
              <small style={{ color: "#94a3b8" }}>1 hour ago</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;