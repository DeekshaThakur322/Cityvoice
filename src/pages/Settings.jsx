import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Settings as SettingsIcon,
  User,
  Phone,
  Lock,
  Bell,
} from "lucide-react";

const Settings = () => {
  const { user, updateProfile, updatePassword } = useAuth();

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Keep form in sync when user object updates
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification Toggles State
  const [notifications, setNotifications] = useState({
    smsUpdates: true,
    slaAlerts: true,
    engineerCalls: true,
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const getInitials = (name) => {
    if (!name) return "MS";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Submit Profile & Phone update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileMsg("");
    setProfileLoading(true);

    const res = await updateProfile({
      name: profileData.name,
      phone: profileData.phone,
    });

    if (res.success) {
      setProfileMsg("Profile & Phone Number updated successfully! ✅");
      setTimeout(() => setProfileMsg(""), 4000);
    } else {
      setProfileError(res.message);
    }
    setProfileLoading(false);
  };

  // Submit Password update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMsg("");

    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match!");
      return;
    }

    setPasswordLoading(true);

    const res = await updatePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    if (res.success) {
      setPasswordMsg("Password changed successfully ! 🔑");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordMsg(""), 4000);
    } else {
      setPasswordError(res.message);
    }
    setPasswordLoading(false);
  };

  return (
    <div className="dashboard-content-flow">
      {/* 1. Header Banner */}
      <div className="skyline-banner">
        <div className="banner-text-content">
          <div className="banner-icon-badge">
            <SettingsIcon size={28} color="#2563eb" />
          </div>
          <div>
            <h2 className="banner-heading">Account & System Settings</h2>
            <p className="banner-subheading">
              Manage your personal profile, field engineer contact info, and notification preferences.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Grid */}
      <div className="settings-grid">
        {/* LEFT COLUMN: User Summary Card */}
        <div className="settings-summary-card">
          <div className="settings-avatar-circle">
            {getInitials(user?.name)}
          </div>

          <h3 className="settings-user-name">{user?.name || "Muskan sahu"}</h3>
          <p className="settings-user-email">{user?.email || "muskan@123"}</p>

          <span className="status-pill pill-resolved">
            Role: {user?.role?.toUpperCase() || "CITIZEN"}
          </span>

          <div className="settings-meta-list">
            <div className="settings-meta-item">
              <span className="settings-meta-label">Phone:</span>
              <span className="settings-meta-val">{user?.phone || "Not added yet"}</span>
            </div>
            <div className="settings-meta-item">
              <span className="settings-meta-label">Account Status:</span>
              <span className="settings-meta-val" style={{ color: "#16a34a" }}>Active Verified ✅</span>
            </div>
            <div className="settings-meta-item">
              <span className="settings-meta-label">Member Since:</span>
              <span className="settings-meta-val">Sept 2026</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings Form Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Card 1: Profile & Phone Number */}
          <div className="form-card-wrapper" style={{ margin: "0", maxWidth: "none" }}>
            <h3 className="settings-section-title">
              <User size={20} color="#2563eb" /> Personal Profile & Contact Details
            </h3>

            {profileMsg && <div className="success-banner">{profileMsg}</div>}
            {profileError && <div className="error-alert">{profileError}</div>}

            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileData.email}
                  disabled
                  style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                />
                <small className="settings-helper-text">Email address cannot be changed (primary login ID).</small>
              </div>

              {/* 📱 PHONE NUMBER FIELD */}
              <div className="form-group">
                <label>Phone Number (For Field Engineer Contact)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
                <small className="settings-helper-text">
                  ℹ️ Municipal field workers will call this number if they need help locating an underground pipeline or damaged streetlight.
                </small>
              </div>

              <button type="submit" className="btn-submit" disabled={profileLoading}>
                {profileLoading ? "Saving to Database..." : "Save Profile Changes"}
              </button>
            </form>
          </div>

          {/* Card 2: Civic Notifications */}
          {/* <div className="form-card-wrapper" style={{ margin: "0", maxWidth: "none" }}>
            <h3 className="settings-section-title">
              <Bell size={20} color="#2563eb" /> Civic Notification Preferences
            </h3>

            <div className="settings-checkbox-group">
              <label className="settings-checkbox-item">
                <input
                  type="checkbox"
                  className="settings-checkbox-input"
                  checked={notifications.smsUpdates}
                  onChange={(e) => setNotifications({ ...notifications, smsUpdates: e.target.checked })}
                />
                <div>
                  <span className="settings-checkbox-title">SMS & Email Status Alerts</span>
                  <span className="settings-checkbox-sub">
                    Receive notifications when your complaint status changes (e.g. In-Progress $\rightarrow$ Resolved).
                  </span>
                </div>
              </label>

              <label className="settings-checkbox-item">
                <input
                  type="checkbox"
                  className="settings-checkbox-input"
                  checked={notifications.slaAlerts}
                  onChange={(e) => setNotifications({ ...notifications, slaAlerts: e.target.checked })}
                />
                <div>
                  <span className="settings-checkbox-title">48-Hour SLA Escalation Warnings</span>
                  <span className="settings-checkbox-sub">
                    Get notified if an unresolved issue in your ward is auto-escalated to Department Head.
                  </span>
                </div>
              </label>

              <label className="settings-checkbox-item">
                <input
                  type="checkbox"
                  className="settings-checkbox-input"
                  checked={notifications.engineerCalls}
                  onChange={(e) => setNotifications({ ...notifications, engineerCalls: e.target.checked })}
                />
                <div>
                  <span className="settings-checkbox-title">On-Site Landmark Assistance</span>
                  <span className="settings-checkbox-sub">
                    Allow on-duty engineers to call your phone number during active field work.
                  </span>
                </div>
              </label>
            </div>
          </div> */}

          {/* Card 3: Security & Password */}
          <div className="form-card-wrapper" style={{ margin: "0", maxWidth: "none" }}>
            <h3 className="settings-section-title">
              <Lock size={20} color="#2563eb" /> Security & Password Management
            </h3>

            {passwordError && <div className="error-alert">{passwordError}</div>}
            {passwordMsg && <div className="success-banner">{passwordMsg}</div>}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" style={{ background: "#0f172a" }} disabled={passwordLoading}>
                {passwordLoading ? "Verifying & Updating..." : "Update Password 🔑"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;