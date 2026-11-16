import User from "../modal/authSchema.js";
import { genToken } from "../../utils/genToken.js";

// PRE-AUTHORIZED MUNICIPAL SERVICE REGISTRY
const AUTHORIZED_OFFICIAL_CODES = [
  "MC-PWD-101",      // Roads & Infrastructure Cell
  "MC-ELEC-202",     // Electricity & Lighting Cell
  "MC-WATER-303",    // Water Supply & Drainage Board
  "MC-SANIT-404",    // Solid Waste Management
  "MC-OFFICER-505",  // General Grievance Staff
];

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, officialCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const assignedRole = role === "official" ? "official" : "citizen";

    //  VERIFY MUNICIPAL EMPLOYEE REGISTRY IF REGISTERING AS OFFICIAL
    if (assignedRole === "official") {
      const formattedCode = (officialCode || "").trim().toUpperCase();

      if (!formattedCode) {
        return res.status(400).json({
          success: false,
          message: "Municipal Employee Service ID is required for official registration.",
        });
      }

      const isValidCode = AUTHORIZED_OFFICIAL_CODES.includes(formattedCode);
      if (!isValidCode) {
        return res.status(403).json({
          success: false,
          message:
            "Invalid Employee ID. This code is not in the Municipal Corporation authorized registry.",
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      phone: phone || "",
    });

    const token = genToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: "User registered successfully! ",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error during registration",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials (User not found)",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials (Incorrect password)",
      });
    }

    const token = genToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Logged in successfully! ",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error during login",
    });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Update profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    const updatedUser = await user.save();
    res.status(200).json({
      success: true,
      message: "Profile updated successfully! ",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password!" });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password changed successfully! ",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};