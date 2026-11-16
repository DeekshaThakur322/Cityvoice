import React, { useState, useEffect } from "react";
import apiClient from "../ApiClient/interceptor";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  Building2,
  Activity,
  ShieldCheck,
  MapPin,
  User,
  Trash2,
  Download,
  Camera,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all issues from backend
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await apiClient.get("/issues");
        setIssues(res.data.data || []);
      } catch (err) {
        console.error("Failed to load dashboard issues", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // 🌟 Official Status Update with Proof Enforcement
  const handleStatusChange = async (issueId, newStatus) => {
    // 🛑 STRICT ENFORCEMENT: Resolving requires mandatory photo proof!
    if (newStatus === "Resolved") {
      alert(
        "📸 Mandatory Photo Proof Required!\n\nMunicipal protocol requires an 'After' repair photo to mark an issue Resolved. Redirecting you to attach photo proof..."
      );
      navigate(`/issue/${issueId}`);
      return;
    }

    try {
      await apiClient.patch(`/issues/${issueId}/status`, {
        status: newStatus,
        comment: `Official (${user?.name || "Municipal Officer"}) changed status to ${newStatus}.`,
      });

      setIssues((prev) =>
        prev.map((iss) =>
          iss._id === issueId ? { ...iss, status: newStatus } : iss
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  // 🗑️ Delete Issue (Citizens only for their own issues)
  const handleDeleteIssue = async (issueId, issueTitle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${issueTitle}"? This cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const res = await apiClient.delete(`/issues/${issueId}`);
      if (res.data.success) {
        setIssues((prev) => prev.filter((i) => i._id !== issueId));
        alert("Issue deleted successfully! 🗑️");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete issue");
    }
  };

  // -------------------------------------------------------------
  // 🎯 ROLE-BASED DATA FILTERING
  // -------------------------------------------------------------
  const isOfficial = user?.role === "official" || user?.role === "admin";

  // If Citizen: ONLY complaints reported by this citizen!
  // If Official: ALL complaints across the city!
  const roleFilteredIssues = isOfficial
    ? issues
    : issues.filter((i) => {
        const reporterId = i.reportedBy?._id || i.reportedBy;
        const currentUserId = user?.id || user?._id;
        const matchesId =
          currentUserId &&
          reporterId &&
          reporterId.toString() === currentUserId.toString();
        const matchesName = user?.name && i.reportedBy?.name === user.name;
        return matchesId || matchesName;
      });

  // Table complaints (CLOSED issues are removed from active table!)
  const activeTableIssues = roleFilteredIssues.filter(
    (issue) => issue.status !== "Closed"
  );

  // Stats Calculation
  const totalCount = roleFilteredIssues.length;
  const pendingCount = roleFilteredIssues.filter(
    (i) => i.status === "Reported" || i.status === "Under-Review"
  ).length;
  const inProgressCount = roleFilteredIssues.filter(
    (i) => i.status === "In-Progress" || i.status === "In Progress"
  ).length;
  const resolvedCount = roleFilteredIssues.filter(
    (i) => i.status === "Resolved" || i.status === "Closed"
  ).length;
  const escalatedCount = roleFilteredIssues.filter(
    (i) => i.status === "Escalated" || i.priority === "Critical"
  ).length;

  const slaComplianceRate =
    totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  const getDeptPercentage = (category) => {
    if (totalCount === 0) return 0;
    const count = roleFilteredIssues.filter((i) => i.category === category).length;
    return Math.round((count / totalCount) * 100);
  };

  const getDeptCount = (category) => {
    return roleFilteredIssues.filter((i) => i.category === category).length;
  };

  // 📊 One-Click CSV Export (Only for Officials)
  const handleExportCSV = () => {
    if (activeTableIssues.length === 0) {
      alert("No complaints available to export.");
      return;
    }

    const headers = [
      "Ticket ID",
      "Title",
      "Category",
      "Department",
      "Priority",
      "Status",
      "Address",
      "Reported By",
      "Date Reported",
    ];

    const rows = activeTableIssues.map((issue) => [
      `"${issue.ticketId || "CV-XXXX"}"`,
      `"${issue.title.replace(/"/g, '""')}"`,
      `"${issue.category}"`,
      `"${issue.department || "General Cell"}"`,
      `"${issue.priority || "Medium"}"`,
      `"${issue.status}"`,
      `"${(issue.address || "").replace(/"/g, '""')}"`,
      `"${issue.reportedBy?.name || "Citizen"}"`,
      `"${new Date(issue.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `CityVoice_Municipal_Grievance_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-content-flow">
      {/* 1. Dynamic Skyline Header Banner */}
      <div className="skyline-banner">
        <div className="banner-text-content">
          <div className="banner-icon-badge">
            <Building2 size={28} color="#2563eb" />
          </div>
          <div>
            <h2 className="banner-heading">
              {isOfficial ? "Municipal Grievance Command Center" : "Citizen Grievance Dashboard"}
            </h2>
            <p className="banner-subheading">
              {isOfficial
                ? "Real-time monitoring of city-wide operations, active 48h SLA performance, and ward triage."
                : `Active tracking and management of civic issues reported by ${user?.name || "you"}.`}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top Pastel Stat Cards */}
      <div className="pastel-stats-grid">
        <div className="pastel-card card-blue">
          <div className="card-icon-circle bg-blue">
            <FileText size={22} />
          </div>
          <div>
            <h3 className="card-number">{totalCount}</h3>
            <p className="card-label">
              {isOfficial ? "City Complaints" : "My Reported Issues"}
            </p>
          </div>
        </div>

        <div className="pastel-card card-pink">
          <div className="card-icon-circle bg-pink">
            <Clock size={22} />
          </div>
          <div>
            <h3 className="card-number">{pendingCount}</h3>
            <p className="card-label">Pending Review</p>
          </div>
        </div>

        <div className="pastel-card card-amber">
          <div className="card-icon-circle bg-amber">
            <Wrench size={22} />
          </div>
          <div>
            <h3 className="card-number">{inProgressCount}</h3>
            <p className="card-label">Under Repair</p>
          </div>
        </div>

        <div className="pastel-card card-green">
          <div className="card-icon-circle bg-green">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h3 className="card-number">{resolvedCount}</h3>
            <p className="card-label">Resolved & Closed</p>
          </div>
        </div>
      </div>

      {/* 3. Analytics Grid */}
      <div className="analytics-grid">
        {/* Department Workload */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3 className="analytics-title">
              <Activity size={18} color="#2563eb" />
              {isOfficial ? "Department Workload Distribution" : "My Issues by Category"}
            </h3>
            <span className="analytics-badge">{isOfficial ? "Live City Triage" : "Personal"}</span>
          </div>

          <div className="dept-meter-list">
            <div className="dept-meter-row">
              <div className="dept-meter-label">
                <span>🛣️ Roads & Infrastructure (PWD)</span>
                <span>{getDeptCount("Roads & Potholes")} issues ({getDeptPercentage("Roads & Potholes")}%)</span>
              </div>
              <div className="dept-meter-bar-bg">
                <div
                  className="dept-meter-bar-fill"
                  style={{ width: `${getDeptPercentage("Roads & Potholes")}%`, background: "#2563eb" }}
                />
              </div>
            </div>

            <div className="dept-meter-row">
              <div className="dept-meter-label">
                <span>⚡ Electricity & Streetlighting Cell</span>
                <span>{getDeptCount("Electricity & Lighting")} issues ({getDeptPercentage("Electricity & Lighting")}%)</span>
              </div>
              <div className="dept-meter-bar-bg">
                <div
                  className="dept-meter-bar-fill"
                  style={{ width: `${getDeptPercentage("Electricity & Lighting")}%`, background: "#f59e0b" }}
                />
              </div>
            </div>

            <div className="dept-meter-row">
              <div className="dept-meter-label">
                <span>🚰 Water Supply & Drainage Board</span>
                <span>{getDeptCount("Water Supply & Drainage")} issues ({getDeptPercentage("Water Supply & Drainage")}%)</span>
              </div>
              <div className="dept-meter-bar-bg">
                <div
                  className="dept-meter-bar-fill"
                  style={{ width: `${getDeptPercentage("Water Supply & Drainage")}%`, background: "#06b6d4" }}
                />
              </div>
            </div>

            <div className="dept-meter-row">
              <div className="dept-meter-label">
                <span>🗑️ Solid Waste Management & Sanitation</span>
                <span>{getDeptCount("Sanitation & Garbage")} issues ({getDeptPercentage("Sanitation & Garbage")}%)</span>
              </div>
              <div className="dept-meter-bar-bg">
                <div
                  className="dept-meter-bar-fill"
                  style={{ width: `${getDeptPercentage("Sanitation & Garbage")}%`, background: "#10b981" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SLA Health */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3 className="analytics-title">
              <ShieldCheck size={18} color="#16a34a" /> 48h SLA Health Index
            </h3>
            <span className="analytics-badge">
              Target: &gt;80%
            </span>
          </div>

          <div className="sla-health-content">
            <div className="sla-score-circle">
              <span className="sla-score-number">{slaComplianceRate}%</span>
              <span className="sla-score-sub">Compliance</span>
            </div>

            <p className="sla-status-note">
              {slaComplianceRate >= 75
                ? "🟢 Redressal turnaround operating within standard SLA limits."
                : "🟠 SLA breaches detected. Department acceleration advised."}
            </p>

            <div className="sla-stats-row">
              <div className="sla-stat-box">
                <div className="sla-stat-val">
                  {escalatedCount}
                </div>
                <div className="sla-stat-lbl">Breached / Escalated</div>
              </div>
              <div className="sla-stat-box">
                <div className="sla-stat-val">
                  48 Hrs
                </div>
                <div className="sla-stat-lbl">Maximum SLA Window</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Complaints Table */}
      <div className="modern-table-card">
        <div className="table-header-bar">
          <div>
            <h3 className="table-header-title">
              {isOfficial ? "Active City Grievances" : "My Active Grievances"}
            </h3>
            <p className="table-header-sub">
              Showing {activeTableIssues.length} active unresolved records
            </p>
          </div>

          {/* Export CSV (Only for Officials) */}
          {isOfficial && (
            <button
              onClick={handleExportCSV}
              className="btn-export-csv"
            >
              <Download size={15} color="#2563eb" />
              <span>Export Audit CSV</span>
            </button>
          )}
        </div>

        <table className="custom-data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Problem & Category</th>
              <th>Address / Landmark</th>
              <th>Reported By</th>
              <th>Current Status</th>
              <th className="cell-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="table-msg-cell">
                  Loading active complaints...
                </td>
              </tr>
            ) : activeTableIssues.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-msg-cell">
                  {isOfficial
                    ? "No active civic complaints currently pending across the city! 🎉"
                    : "You have no active unresolved complaints. All your issues have been resolved & closed! 🎉"}
                </td>
              </tr>
            ) : (
              activeTableIssues.map((issue) => (
                <tr key={issue._id} className="table-row-hover">
                  <td className="ticket-id-cell">
                    <Link to={`/issue/${issue._id}`} className="ticket-link">
                      {issue.ticketId || "CV-XXXX"}
                    </Link>
                  </td>
                  <td>
                    <div className="problem-title">{issue.title}</div>
                    <div className="category-bullet">
                      <span className="bullet-dot"></span>
                      <span>{issue.category}</span>
                    </div>
                  </td>
                  <td className="address-cell">
                    <MapPin size={14} className="pin-icon" />
                    <span>{issue.address}</span>
                  </td>
                  <td className="reporter-cell">
                    <User size={14} className="user-icon" />
                    <span>{issue.reportedBy?.name || "Citizen"}</span>
                  </td>
                  
                  {/* Status Cell */}
                  <td>
                    {isOfficial ? (
                      <select
                        value={issue.status}
                        onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                        className="status-dropdown"
                      >
                        <option value="Reported">Reported</option>
                        <option value="Under-Review">Under-Review</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Resolved">Resolved (Requires Proof 📸)</option>
                      </select>
                    ) : (
                      <span
                        className={`status-pill pill-${issue.status
                          ?.toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        <span className="status-dot"></span>
                        {issue.status}
                      </span>
                    )}
                  </td>

                  {/* Action Cell */}
                  <td className="cell-center">
                    {isOfficial ? (
                      <button
                        onClick={() => navigate(`/issue/${issue._id}`)}
                        className="btn-upload-fix"
                        title="Open ticket to upload repair photo"
                      >
                        <Camera size={13} />
                        <span>Upload Fix</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteIssue(issue._id, issue.title)}
                        className="btn-delete-row"
                        title="Delete this ticket"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;