import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../ApiClient/interceptor";
import { Ticket, MapPin } from "lucide-react";

const MyTickets = () => {
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);


 useEffect(() => {
  const fetchMyTickets = async () => {
    try {
      const res = await apiClient.get("/issues/my");
      setMyIssues(res.data.data);
    } catch (err) {
      console.error("Error fetching your tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchMyTickets();
}, []);

  return (
    <div className="dashboard-content-flow">
      <div className="skyline-banner">
        <div className="banner-text-content">
          <div className="banner-icon-badge">
            <Ticket size={28} color="#2563eb" />
          </div>
          <div>
            <h2 className="banner-heading">My Reported Tickets</h2>
            <p className="banner-subheading">Track all civic issues you have reported across the city.</p>
          </div>
        </div>
      </div>

      <div className="modern-table-card">
        <table className="custom-data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Problem & Category</th>
              <th>Address / Landmark</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="table-empty">Loading your tickets...</td></tr>
            ) : myIssues.length === 0 ? (
              <tr><td colSpan="4" className="table-empty">You haven't reported any issues yet.</td></tr>
            ) : (
              myIssues.map((issue) => (
                <tr key={issue._id} className="table-row-hover">
                  <td className="ticket-id-cell">
                    <Link
                      to={`/issue/${issue._id}`}
                      style={{
                        color: "#2563eb",
                        textDecoration: "none",
                        fontWeight: "700",
                      }}
                    >
                      {issue.ticketId}
                    </Link>
                  </td>
                  <td>
  <div>
    <strong>{issue.title}</strong>
    <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
      {issue.category}
    </div>
  </div>
</td>

<td>
  <div className="address-cell">
    <MapPin size={14} className="pin-icon" />
    <span>{issue.address}</span>
  </div>
</td>

<td>
  <span className={`status-pill pill-${issue.status.toLowerCase().replace(" ", "-")}`}>
    <span className="status-dot"></span>
    {issue.status}
  </span>
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

export default MyTickets;