import React, { createContext, useState, useEffect, useContext } from "react";
import apiClient from "../ApiClient/interceptor";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("cityvoice_token") || null);
  const [loading, setLoading] = useState(true);
1
  useEffect(() => {
    const savedUser = localStorage.getItem("cityvoice_user");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, [token]);

  // 1. Login
  const login = async (email, password) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem("cityvoice_token", newToken);
      localStorage.setItem("cityvoice_user", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // 2. Signup
  const signup = async (formData) => {
    try {
      await apiClient.post("/auth/register", formData);
      return { success: true, message: "Account created successfully! 🎉" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // 3. Update Profile (Name & Phone)
  const updateProfile = async (data) => {
    try {
      const res = await apiClient.put("/auth/profile", data);
      const updatedUser = res.data.user;

      // Update state and localStorage
      setUser(updatedUser);
      localStorage.setItem("cityvoice_user", JSON.stringify(updatedUser));
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile",
      };
    }
  };

  // 4. Change Password
  const updatePassword = async (data) => {
    try {
      const res = await apiClient.put("/auth/change-password", data);
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to change password",
      };
    }
  };

  // 5. Logout
  const logout = () => {
    localStorage.removeItem("cityvoice_token");
    localStorage.removeItem("cityvoice_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, updateProfile, updatePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);