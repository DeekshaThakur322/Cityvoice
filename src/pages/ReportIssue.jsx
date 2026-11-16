import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../ApiClient/interceptor";
import {
  AlertTriangle,
  Sparkles,
  Cpu,
  Clock,
  Building2,
  Upload,
  X,
  Image as ImageIcon,
  MapPin,
  ExternalLink,
} from "lucide-react";

// Map each category to its default responsible department
const categoryDepartmentMap = {
  "Roads & Potholes": "Public Works Department (PWD - Civil Infrastructure)",
  "Sanitation & Garbage": "Solid Waste Management & Sanitation Board",
  "Electricity & Lighting": "State Electricity Transmission & Streetlighting Cell",
  "Water Supply & Drainage": "Water Supply & Sewerage Drainage Board",
  "Public Safety": "Traffic Police & Public Safety Directorate",
  "Other": "General Municipal Grievance Cell",
};

const departmentOptions = [
  "Public Works Department (PWD - Civil Infrastructure)",
  "Solid Waste Management & Sanitation Board",
  "State Electricity Transmission & Streetlighting Cell",
  "Water Supply & Sewerage Drainage Board",
  "Traffic Police & Public Safety Directorate",
  "General Municipal Grievance Cell",
];

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Roads & Potholes",
    department: "Public Works Department (PWD - Civil Infrastructure)",
    priority: "Medium",
    longitude: 77.5946,
    latitude: 12.9716,
    address: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [existingIssues, setExistingIssues] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  // 1. Fetch active issues on load for instant duplicate detection
  useEffect(() => {
    const fetchActiveIssues = async () => {
      try {
        const res = await apiClient.get("/issues");
        const active = (res.data.data || []).filter(
          (i) => i.status !== "Closed" && i.status !== "Resolved"
        );
        setExistingIssues(active);
      } catch (err) {
        console.error("Failed to load active issues for duplicate check", err);
      }
    };
    fetchActiveIssues();
  }, []);

  // 2. Smart Duplicate Detector (checks category + address keywords)
  const checkForDuplicates = (category, address, title) => {
    if (!address && !title) {
      setDuplicateWarning(null);
      return;
    }

    const searchAddr = (address || "").toLowerCase().trim();
    const searchTitle = (title || "").toLowerCase().trim();

    const match = existingIssues.find((iss) => {
      const sameCategory = iss.category === category;
      const existAddr = (iss.address || "").toLowerCase();
      const existTitle = (iss.title || "").toLowerCase();

      // Check if address words overlap (e.g. "dharmshala", "main market")
      const addrWords = searchAddr.split(/[\s,]+/).filter((w) => w.length > 3);
      const hasAddrMatch = addrWords.some((word) => existAddr.includes(word));

      const hasTitleMatch =
        searchTitle.length > 3 &&
        (existTitle.includes(searchTitle) || searchTitle.includes(existTitle));

      return sameCategory && (hasAddrMatch || hasTitleMatch);
    });

    setDuplicateWarning(match || null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    // Auto-update department if category changes
    if (name === "category") {
      updated.department = categoryDepartmentMap[value] || updated.department;
    }

    setFormData(updated);

    // Live duplicate check
    checkForDuplicates(
      name === "category" ? value : updated.category,
      name === "address" ? value : updated.address,
      name === "title" ? value : updated.title
    );
  };

  // 📍 1-Click GPS Locator
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        alert("GPS Coordinates detected successfully! 📍");
      },
      (err) => {
        alert("Unable to fetch location: " + err.message);
      }
    );
  };

  // 📸 Handle real file selection from device
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size exceeds 5MB. Please choose a smaller photo.");
        return;
      }
      setError("");
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl("");
  };

  const handleAiAutoTriage = async () => {
    if (!formData.title && !formData.description) {
      setError("Please provide a problem title or description for AI analysis.");
      return;
    }

    try {
      setError("");
      setAiAnalyzing(true);
      const res = await apiClient.post("/issues/ai-classify", {
        title: formData.title,
        description: formData.description,
      });

      if (res.data.success && res.data.data) {
        const aiData = res.data.data;
        setAiInsight(aiData);
        setFormData((prev) => ({
          ...prev,
          category: aiData.category,
          department: aiData.department,
          priority: aiData.priority,
        }));
        checkForDuplicates(aiData.category, formData.address, formData.title);
      }
    } catch (err) {
      console.error("AI Triage error:", err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // 🚀 SUBMIT FORM WITH STRICT DUPLICATE BLOCK
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 🛑 Hard block on duplicate
    if (duplicateWarning) {
      setError(
        `⛔ Submission Blocked: An active complaint ("${duplicateWarning.title}" - #${duplicateWarning.ticketId}) already exists at this location.`
      );
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("department", formData.department);
      data.append("priority", formData.priority);
      data.append("address", formData.address);
      data.append("longitude", formData.longitude);
      data.append("latitude", formData.latitude);

      if (imageFile) {
        data.append("image", imageFile);
      }

      await apiClient.post("/issues", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card-wrapper">
      <div className="form-header-row">
        <div>
          <h2>📢 Report a Civic Problem</h2>
          <p className="banner-subheading">
            Help municipal authorities fix broken infrastructure in your ward.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAiAutoTriage}
          disabled={aiAnalyzing}
          className="btn-ai-triage"
        >
          <Sparkles size={16} />
          {aiAnalyzing ? "Analyzing Issue..." : "✨ Optional: AI Auto-Triage"}
        </button>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* ⚠️ LIVE DUPLICATE WARNING ALERT */}
      {duplicateWarning && (
        <div className="duplicate-blocked-card">
          <div className="duplicate-blocked-header">
            <AlertTriangle size={22} />
            <span>⛔ Duplicate Complaint Blocked!</span>
          </div>
          <p className="duplicate-blocked-desc">
            An active complaint for <strong>"{duplicateWarning.title}"</strong> (Ticket <strong>#{duplicateWarning.ticketId || "CV-XXXX"}</strong>) was already reported at <strong>"{duplicateWarning.address}"</strong>.
          </p>
          <p className="duplicate-blocked-sub">
            To prevent municipal record duplication, new submissions for this problem are strictly blocked.
          </p>
          <div>
            <Link
              to={`/issue/${duplicateWarning._id}`}
              target="_blank"
              className="btn-view-duplicate"
            >
              <span>👉 View & Upvote Existing Ticket #{duplicateWarning.ticketId}</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* AI Smart Triage Assessment Card */}
      {aiInsight && (
        <div className="ai-triage-card">
          <div className="ai-triage-header">
            <div className="ai-triage-title">
              <Cpu size={18} color="#16a34a" />
              <span>AI Auto-Triage Assessment</span>
            </div>
            <span className="ai-triage-confidence">
              Confidence: {aiInsight.confidence}
            </span>
          </div>

          <p className="ai-triage-text">{aiInsight.urgencyReason}</p>

          <div className="ai-triage-pills">
            <div className="ai-triage-pill-item">
              <Building2 size={15} color="#4f46e5" />
              <strong>Dept:</strong> {aiInsight.department}
            </div>
            <div className="ai-triage-pill-item">
              <Clock size={15} color="#ea580c" />
              <strong>SLA:</strong> {aiInsight.slaHours} Hours ({aiInsight.priority} Priority)
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Problem Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Broken Streetlight or Sewage overflow"
            className="form-input"
            required
          />
        </div>

        {/* 1. Category Selection */}
        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-input"
          >
            <option value="Roads & Potholes">Roads & Potholes</option>
            <option value="Sanitation & Garbage">Sanitation & Garbage</option>
            <option value="Electricity & Lighting">Electricity & Lighting</option>
            <option value="Water Supply & Drainage">Water Supply & Drainage</option>
            <option value="Public Safety">Public Safety</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* 2. Assigned Department (Selectable Dropdown) */}
        <div className="form-group">
          <label>Assigned Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="form-input"
          >
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the issue in detail..."
            className="form-input"
            rows="3"
            required
          />
        </div>

        <div className="form-group">
          <label>Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="form-input"
          >
            <option value="Low">Low (72h SLA)</option>
            <option value="Medium">Medium (48h SLA)</option>
            <option value="High">High (36h SLA)</option>
            <option value="Critical">Critical (24h SLA)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Street Address / Landmark</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. Dharmshala main market, near PNB bank"
            className="form-input"
            required
          />
        </div>

        <div className="form-coords-grid">
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Longitude</label>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="btn-detect-gps"
              >
                <MapPin size={12} /> Detect GPS
              </button>
            </div>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label>Latitude</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* 📸 REAL CLOUDINARY FILE UPLOADER */}
        <div className="form-group">
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ImageIcon size={16} color="#2563eb" />
            <span>Attach Problem Photographic Proof (Cloudinary)</span>
          </label>

          {!previewUrl ? (
            <div className="file-dropzone-box">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-hidden-input"
              />
              <div className="file-dropzone-content">
                <div className="upload-circle-icon">
                  <Upload size={22} color="#2563eb" />
                </div>
                <span className="upload-label-main">
                  Click to choose a photo from your device
                </span>
                <span className="upload-label-sub">
                  Supports JPG, PNG, WEBP (Max 5MB) • Auto-streamed to Cloudinary CDN
                </span>
              </div>
            </div>
          ) : (
            <div className="preview-container">
              <img
                src={previewUrl}
                alt="Selected Problem Preview"
                className="preview-image"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="btn-remove-preview"
                title="Remove photo"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* 🛑 SUBMIT BUTTON (Strictly disabled if duplicate detected) */}
        <button
          type="submit"
          className={`btn-submit ${duplicateWarning ? "btn-submit-blocked" : ""}`}
          disabled={loading || !!duplicateWarning}
        >
          {loading
            ? "Uploading to Cloudinary & Submitting..."
            : duplicateWarning
            ? "🚫 Submission Blocked (Duplicate Issue Detected)"
            : "Submit Civic Report 📢"}
        </button>
      </form>
    </div>
  );
};

export default ReportIssue;