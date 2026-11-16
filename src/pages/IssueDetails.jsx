
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../ApiClient/interceptor";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  ThumbsUp,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Building2,
  ShieldCheck,
  Upload,
  X,
  Star,
  Phone
} from "lucide-react";

const IssueDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Official Action State
  const [officialStatus, setOfficialStatus] = useState("In-Progress");
  const [officialComment, setOfficialComment] = useState("");
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [afterPreviewUrl, setAfterPreviewUrl] = useState("");
  const [officialUpdating, setOfficialUpdating] = useState(false);

  // Citizen Verification State
  const [verificationComment, setVerificationComment] = useState("");
  const [citizenRating, setCitizenRating] = useState(5);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const response = await apiClient.get(`/issues/${id}`);
        setIssue(response.data.data);

        if (response.data.data.status) {
          setOfficialStatus(
            response.data.data.status === "Reported"
              ? "In-Progress"
              : response.data.data.status
          );
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load issue");
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id]);

  const handleAfterImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setAfterImageFile(file);
      setAfterPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveAfterImage = () => {
    setAfterImageFile(null);
    setAfterPreviewUrl("");
  };

  const handleOfficialStatusUpdate = async (e) => {
    e.preventDefault();

    try {
      setOfficialUpdating(true);

      const formData = new FormData();
      formData.append("status", officialStatus);
      formData.append(
        "comment",
        officialComment || `Official updated status to ${officialStatus}`
      );

      if (afterImageFile) {
        formData.append("image", afterImageFile);
      }

      const response = await apiClient.patch(
        `/issues/${id}/status`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setIssue(response.data.data);
      setAfterImageFile(null);
      setAfterPreviewUrl("");
      setOfficialComment("");

      alert(`Status successfully updated to ${officialStatus}! 🎉`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setOfficialUpdating(false);
    }
  };

  const handleVerification = async (verified) => {
    try {
      setVerifying(true);

      const response = await apiClient.patch(`/issues/${id}/verify`, {
        verified,
        comment: verificationComment,
        rating: verified ? citizenRating : null,
      });

      setIssue(response.data.data);
      setVerificationComment("");

      alert(
        verified
          ? `Issue verified & closed with a ${citizenRating}/5 ⭐ rating! ✅`
          : "Issue reopened successfully! 🔄"
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update issue verification");
    } finally {
      setVerifying(false);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  if (loading) {
    return <div className="table-empty">Loading ticket details...</div>;
  }

  if (error) {
    return <div className="error-alert">{error}</div>;
  }

  if (!issue) {
    return <div className="table-empty">Issue not found.</div>;
  }

  return (
    <div className="dashboard-content-flow printable-issue-page">

      {/* Screen-Only Top Action Bar */}
      <div className="no-print issue-style-1">
        <Link className="issue-style-2" to="/dashboard">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <button
          className="issue-style-3"
          onClick={handlePrintCertificate}
        >
          <Printer size={16} />
          Print / Download Official PDF Receipt
        </button>
      </div>

      {/* PDF Header */}
      <div className="official-print-header">
        <div className="issue-style-4">
          <div>
            <h1 className="issue-style-5">
              CityVoice Municipal Redressal Authority
            </h1>

            <p className="issue-style-6">
              Official Citizen Grievance Record & Redressal Certificate
            </p>
          </div>

          <div className="issue-style-7">
            <span className="issue-style-8">
              DOCUMENT ID: {issue.ticketId}
            </span>

            <p className="issue-style-9">
              Generated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Banner */}
      <div className="skyline-banner">
        <div className="banner-text-content">
          <div className="banner-icon-badge">
            <CheckCircle2 size={28} color="#2563eb" />
          </div>

          <div>
            <h2 className="banner-heading">{issue.title}</h2>
            <p className="banner-subheading">
              Ticket ID: {issue.ticketId}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="issue-style-10">

        {/* LEFT COLUMN */}
        <div className="form-card-wrapper issue-style-11">
          <h3 className="issue-style-12">
            Issue Information
          </h3>

          <div className="issue-card">
            <p className="issue-desc">{issue.description}</p>

            {/* Before and After Photos */}
            <div className="issue-style-13">
              <h4 className="issue-style-14">
                📸 Photographic Evidence (Before vs After)
              </h4>

              <div className="issue-style-15">

                {/* Before Photo */}
                <div>
                  <span className="issue-style-16">
                    • Reported Condition (Before)
                  </span>

                  {issue.images?.before && issue.images.before.length > 0 ? (
                    <img
                      className="issue-style-17"
                      src={issue.images.before[0]}
                      alt="Reported condition"
                    />
                  ) : (
                    <div className="issue-style-18">
                      No "Before" photo uploaded
                    </div>
                  )}
                </div>

                {/* After Photo */}
                <div>
                  <span className="issue-style-19">
                    • Official Resolution (After)
                  </span>

                  {issue.images?.after && issue.images.after.length > 0 ? (
                    <img
                      className="issue-style-20"
                      src={issue.images.after[0]}
                      alt="Official resolution"
                    />
                  ) : (
                    <div className="issue-style-21">
                      <span>⏳ Awaiting Official Repair</span>
                      <small className="issue-style-22">
                        Photo uploaded on fix
                      </small>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Details List */}
            <div className="issue-style-23">
              <div className="address-cell">
                <MapPin size={18} />
                <strong>Location:</strong> {issue.address}
              </div>

              <div className="address-cell">
                <AlertTriangle size={18} />
                <strong>Category:</strong> {issue.category}
              </div>

              <div className="address-cell">
                <Building2 size={18} />
                <strong>Assigned Department:</strong>{" "}
                {issue.department || "Municipal Grievance Redressal Cell"}
              </div>

              <div className="address-cell">
                <Clock size={18} />
                <strong>Priority Level:</strong> {issue.priority}
              </div>

              <div className="address-cell">
                <User size={18} />
                <strong>Reported By:</strong>{" "}
                {issue.reportedBy?.name || "Citizen"}
              </div>

              {/* Citizen Contact: Officials Only */}
              {(user?.role === "official" || user?.role === "admin") &&
                issue.reportedBy?.phone && (
                  <div className="address-cell">
                    <div className="citizen-phone-box">
                      <Phone size={18} color="#2563eb" />
                      <strong>Citizen Phone:</strong>

                      <a
                        href={`tel:${issue.reportedBy.phone}`}
                        className="phone-contact-link"
                      >
                        {issue.reportedBy.phone}
                      </a>

                      <span className="badge-official-only">
                        Field Officer Contact Only
                      </span>
                    </div>
                  </div>
                )}

              <div className="address-cell">
                <ThumbsUp size={18} />
                <strong>Community Upvotes:</strong>{" "}
                {issue.upvotes?.length || 0}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="form-card-wrapper issue-style-24">
          <h3 className="issue-style-25">Current Status</h3>

          <span
            className={`status-pill pill-${issue.status.toLowerCase().replace(" ", "-")}`}
          >
            <span className="status-dot"></span>
            {issue.status}
          </span>

          <div className="issue-style-26">
            <h4 className="issue-style-27">SLA Deadline</h4>

            <p className="issue-style-28">
              {issue.slaDeadline
                ? new Date(issue.slaDeadline).toLocaleString()
                : "No deadline available"}
            </p>
          </div>

          {/* Citizen Feedback Rating */}
          {issue.status === "Closed" && issue.verification?.rating && (
            <div className="issue-style-29">
              <span className="issue-style-30">
                Citizen Satisfaction Rating:
              </span>

              <div className="issue-style-31">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    fill={
                      star <= issue.verification.rating
                        ? "#f59e0b"
                        : "none"
                    }
                    color={
                      star <= issue.verification.rating
                        ? "#f59e0b"
                        : "#cbd5e1"
                    }
                  />
                ))}

                <span className="issue-style-32">
                  {issue.verification.rating} / 5 Stars
                </span>
              </div>
            </div>
          )}

          {/* Official Action Panel */}
          {(user?.role === "official" || user?.role === "admin") &&
            issue.status !== "Closed" && (
              <div className="no-print issue-style-33">

                <div className="issue-style-34">
                  <ShieldCheck size={18} color="#2563eb" />

                  <h4 className="issue-style-35">
                    Official Action Panel
                  </h4>
                </div>

                <form onSubmit={handleOfficialStatusUpdate}>

                  {/* Status Selection */}
                  <div className="issue-style-36">
                    <label className="issue-style-37">
                      Update Status
                    </label>

                    <select
                      value={officialStatus}
                      onChange={(e) => setOfficialStatus(e.target.value)}
                      className="form-input issue-style-38"
                    >
                      <option value="Under-Review">Under-Review</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Resolved">
                        Resolved (Requires Photo Proof)
                      </option>
                    </select>
                  </div>

                  {/* After Photo Upload */}
                  <div className="issue-style-39">
                    <label className="issue-style-40">
                      Attach "After" Repair Photo Proof
                    </label>

                    {!afterPreviewUrl ? (
                      <label className="issue-style-41">
                        <Upload size={20} color="#2563eb" />

                        <span className="issue-style-42">
                          Click to upload fixed photo
                        </span>

                        <span className="issue-style-43">
                          JPG, PNG, WEBP (Max 5MB)
                        </span>

                        <input
                          className="issue-style-44"
                          type="file"
                          accept="image/*"
                          onChange={handleAfterImageChange}
                        />
                      </label>
                    ) : (
                      <div className="issue-style-45">
                        <img
                          className="issue-style-46"
                          src={afterPreviewUrl}
                          alt="Resolution preview"
                        />

                        <button
                          className="issue-style-47"
                          type="button"
                          onClick={handleRemoveAfterImage}
                          title="Remove photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Comment */}
                  <div className="issue-style-48">
                    <label className="issue-style-49">
                      Resolution Note / Work Done
                    </label>

                    <textarea
                      value={officialComment}
                      onChange={(e) => setOfficialComment(e.target.value)}
                      placeholder="e.g. Pipeline patched, joint sealed, and water pressure restored."
                      rows="2"
                      className="form-input issue-style-50"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={officialUpdating}
                    className={`btn-submit official-submit-button ${
                      officialStatus === "Resolved" ? "is-resolved" : ""
                    }`}
                  >
                    {officialUpdating
                      ? "Uploading Proof & Updating..."
                      : officialStatus === "Resolved"
                      ? "✓ Mark as Resolved with Proof"
                      : "Update Status"}
                  </button>

                </form>
              </div>
            )}

          {/* Citizen Verification */}
          {user?.id === issue.reportedBy?._id &&
            issue.status === "Resolved" &&
            issue.verification?.status === "Pending" && (
              <div className="no-print issue-style-52">

                <h4 className="issue-style-53">
                  Is the issue fixed?
                </h4>

                <p className="issue-style-54">
                  Please inspect the official resolution photo and verify
                  whether the repair is complete.
                </p>

                {/* Star Rating */}
                <div className="issue-style-55">
                  <label className="issue-style-56">
                    Rate the repair quality (1 to 5 Stars):
                  </label>

                  <div className="issue-style-57">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        className={`rating-star ${
                          star <= citizenRating ? "is-active" : ""
                        }`}
                        key={star}
                        size={26}
                        onClick={() => setCitizenRating(star)}
                      />
                    ))}

                    <span className="issue-style-59">
                      {citizenRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <textarea
                  value={verificationComment}
                  onChange={(e) => setVerificationComment(e.target.value)}
                  placeholder="Citizen feedback note (optional)"
                  rows="2"
                  className="form-input issue-style-60"
                />

                <div className="issue-style-61">
                  <button
                    className="issue-style-62"
                    onClick={() => handleVerification(true)}
                    disabled={verifying}
                  >
                    ✓ Yes, Issue Fixed
                  </button>

                  <button
                    className="issue-style-63"
                    onClick={() => handleVerification(false)}
                    disabled={verifying}
                  >
                    Issue Not Fixed
                  </button>
                </div>

              </div>
            )}
        </div>
      </div>

      {/* Timeline Audit Log */}
      <div className="form-card-wrapper issue-style-64">
        <h3 className="issue-style-65">
          Complaint Timeline & Audit Log
        </h3>

        <div className="issue-style-66">
          {issue.timeline?.map((item, index) => (
            <div className="issue-style-67" key={index}>
              <div
                className={`timeline-dot ${
                  item.status === "Resolved" || item.status === "Closed"
                    ? "is-complete"
                    : ""
                }`}
              />

              <div>
                <h4 className="issue-style-69">{item.status}</h4>

                <p className="issue-style-70">
                  {item.comment || "Status updated"}
                </p>

                <small className="issue-style-71">
                  {new Date(item.timestamp).toLocaleString()}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Footer */}
      <div className="official-print-footer">
        <div>
          <p className="issue-style-72">
            This is an automated electronically verified municipal record
            generated by CityVoice.
          </p>

          <p className="issue-style-73">
            Immutable SLA Audit Log | Verified via 2dsphere Geospatial Index
          </p>
        </div>

        <div className="issue-style-74">
          <span className="issue-style-75">
            Authorized Officer
          </span>
        </div>
      </div>

    </div>
  );
};

export default IssueDetails;
