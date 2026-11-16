import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import apiClient from "../ApiClient/interceptor";
import { Search, ThumbsUp, MapPin, Sparkles } from "lucide-react";

// Fix for default Leaflet marker icons in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Helper component inside MapContainer to smoothly fly to selected coordinates
function MapController({ selectedCoords }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 15, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [selectedCoords, map]);

  return null;
}

const Home = () => {
  const [issues, setIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all issues from backend
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await apiClient.get("/issues");
        setIssues(res.data.data || []);
      } catch (err) {
        console.error("Failed to load issues", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // Filter Categories Definition
  const filterChips = [
    { label: "All", value: "All" },
    { label: "🚨 Escalated", value: "Escalated" },
    { label: "⚡ Electricity", value: "Electricity & Lighting" },
    { label: "🚰 Water & Drainage", value: "Water Supply & Drainage" },
    { label: "🛣️ Roads & Potholes", value: "Roads & Potholes" },
    { label: "🗑️ Sanitation", value: "Sanitation & Garbage" },
  ];

  // -------------------------------------------------------------------------
  // 🌟 FILTER OUT CLOSED ISSUES FROM BOTH MAP & FEED!
  // -------------------------------------------------------------------------
  const activeIssues = issues.filter((issue) => issue.status !== "Closed");

  // Compound Filter: Search Text + Category Filter Chip (Only over active issues)
  const filteredIssues = activeIssues.filter((issue) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      issue.title?.toLowerCase().includes(term) ||
      issue.category?.toLowerCase().includes(term) ||
      issue.address?.toLowerCase().includes(term);

    const matchesCategory =
      selectedCategory === "All"
        ? true
        : selectedCategory === "Escalated"
        ? issue.status === "Escalated" || issue.priority === "Critical"
        : issue.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Dynamic count for each chip (only counts active issues)
  const getCountForChip = (chipValue) => {
    if (chipValue === "All") return activeIssues.length;
    if (chipValue === "Escalated") {
      return activeIssues.filter(
        (i) => i.status === "Escalated" || i.priority === "Critical"
      ).length;
    }
    return activeIssues.filter((i) => i.category === chipValue).length;
  };

  // Card click handler (smooth fly-to pin)
  const handleCardClick = (issue) => {
    setSelectedIssueId(issue._id);
    if (issue.location && issue.location.coordinates) {
      const lat = issue.location.coordinates[1];
      const lng = issue.location.coordinates[0];
      setSelectedCoords([lat, lng]);
    }
  };

  // Upvote toggle handler
  const handleUpvote = async (e, issueId) => {
    e.stopPropagation();
    try {
      const res = await apiClient.patch(`/issues/${issueId}/upvote`);
      setIssues((prev) =>
        prev.map((iss) =>
          iss._id === issueId
            ? {
                ...iss,
                upvotes: new Array(res.data.upvoteCount).fill(""),
              }
            : iss
        )
      );
    } catch (err) {
      console.error("Upvote failed", err);
    }
  };

  const defaultCenter = [20.5937, 78.9629]; // Center of India

  return (
    <div className="home-container">
      {/* 1. LEFT SIDE: INTERACTIVE LEAFLET MAP */}
      <div className="map-wrapper">
        <MapContainer
          center={defaultCenter}
          zoom={5}
          scrollWheelZoom={true}
          className="leaflet-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController selectedCoords={selectedCoords} />

          {/* 📍 Pins for Active Issues Only (Closed pins are auto-removed!) */}
          {filteredIssues.map((issue) => {
            const coords = [
              issue.location.coordinates[1],
              issue.location.coordinates[0],
            ];
            return (
              <Marker
                key={issue._id}
                position={coords}
                eventHandlers={{
                  click: () => setSelectedCoords(coords),
                }}
              >
                <Popup>
                  <div style={{ padding: "0.2rem" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                      {issue.title}
                    </strong>
                    <p style={{ margin: "4px 0", fontSize: "0.8rem", color: "#475569" }}>
                      {issue.address}
                    </p>
                    <span
                      className={`status-pill pill-${issue.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {issue.status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* 2. RIGHT SIDE: LIVE CIVIC FEED */}
      <div className="feed-wrapper">
        <div className="feed-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
              Live Civic Feed
            </h2>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: "700",
                color: "#2563eb",
                background: "#eff6ff",
                padding: "0.25rem 0.65rem",
                borderRadius: "12px",
              }}
            >
              {filteredIssues.length} active issues
            </span>
          </div>

          {/* Search Input */}
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              color="#94a3b8"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: "2.4rem" }}
              placeholder="Search active issues by title, street, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 🌟 FILTER CHIPS ROW */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.4rem",
              marginTop: "0.25rem",
              scrollbarWidth: "none",
            }}
          >
            {filterChips.map((chip) => {
              const isActive = selectedCategory === chip.value;
              const count = getCountForChip(chip.value);

              return (
                <button
                  key={chip.value}
                  onClick={() => setSelectedCategory(chip.value)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "20px",
                    border: isActive ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    background: isActive ? "#2563eb" : "#ffffff",
                    color: isActive ? "#ffffff" : "#475569",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: isActive ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{chip.label}</span>
                  <span
                    style={{
                      background: isActive ? "rgba(255, 255, 255, 0.25)" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#64748b",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "10px",
                      fontSize: "0.72rem",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FEED LIST (Closed issues are excluded!) */}
        <div className="feed-scroll">
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              Loading active civic complaints...
            </div>
          ) : filteredIssues.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem 1rem",
                color: "#64748b",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px dashed #cbd5e1",
                marginTop: "1rem",
              }}
            >
              <p style={{ fontWeight: "700", fontSize: "0.95rem", color: "#334155" }}>
                No active complaints
              </p>
              <small>All issues in this category are resolved or closed! 🎉</small>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isSelected = selectedIssueId === issue._id;

              return (
                <div
                  key={issue._id}
                  className="issue-card"
                  onClick={() => handleCardClick(issue)}
                  style={{
                    cursor: "pointer",
                    border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: isSelected ? "#f0f7ff" : "#ffffff",
                    boxShadow: isSelected ? "0 4px 16px rgba(37, 99, 235, 0.15)" : undefined,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div className="issue-header">
                    <div>
                      <h3 className="issue-title">{issue.title}</h3>
                      <p className="issue-meta">
                        {issue.ticketId || "CV-XXXX"} • {issue.category}
                      </p>
                    </div>

                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        color:
                          issue.status === "Resolved"
                            ? "#16a34a"
                            : issue.status === "In-Progress" || issue.status === "In Progress"
                            ? "#ea580c"
                            : issue.status === "Escalated"
                            ? "#dc2626"
                            : "#2563eb",
                      }}
                    >
                      {issue.status}
                    </span>
                  </div>

                  <p className="issue-desc">{issue.description}</p>

                  <div className="issue-footer">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <MapPin size={15} color="#94a3b8" />
                      <span style={{ fontSize: "0.8rem" }}>{issue.address}</span>
                    </div>

                    <button
                      className="btn-upvote"
                      onClick={(e) => handleUpvote(e, issue._id)}
                    >
                      <ThumbsUp size={14} />
                      <span>{issue.upvotes?.length || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;