import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck } from "lucide-react";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "citizen",
    officialCode: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Quick client-side check if official code is missing
    if (formData.role === "official" && !formData.officialCode.trim()) {
      setError("Please provide your Municipal Employee Service ID.");
      return;
    }

    setLoading(true);

    const result = await signup(formData);

    if (result.success) {
      navigate("/signin", {
        state: { successMsg: "Account created successfully! 🎉 Please sign in with your credentials." },
      });
    } else {
      setError(result.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account </h2>
          <p>Join CityVoice to help improve your neighborhood</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. Deeksha Thakur"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. deeksha@test.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="At least 6 characters"
              required
            />
          </div>

          {/* Role Selector */}
          <div className="form-group">
            <label>Register As</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-input"
            >
              <option value="citizen">Citizen</option>
              <option value="official">Municipal Official / Staff</option>
            </select>
          </div>

          {/* 🔒 Municipal Employee Code Input (Only visible when Official is selected) */}
          {formData.role === "official" && (
            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "5px", color: "#2563eb", fontWeight: "700" }}>
                <ShieldCheck size={16} />
                <span>Government Employee Service ID</span>
              </label>
              <input
                type="text"
                name="officialCode"
                value={formData.officialCode}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. MC-PWD-101, MC-ELEC-202"
                required
              />
              <span className="auth-hint-text">
                🔒 Authorized Municipal Service ID required for official onboarding.
              </span>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;