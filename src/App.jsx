import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Layout from "./common/Layout";
import ProtectedRoute from "./common/ProtectedRoute";

import Home from "./pages/Home";
import ReportIssue from "./pages/ReportIssue";
import Dashboard from "./pages/Dashboard";
import MyTickets from "./pages/MyTickets";
import Settings from "./pages/Settings";

import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
import IssueDetails from "./pages/IssueDetails";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<Layout />}>

            {/* PUBLIC ROUTES */}
            <Route index element={<Home />} />
            <Route path="signin" element={<Signin />} />
            <Route path="signup" element={<Signup />} />

            {/* PROTECTED ROUTES */}
            <Route element={<ProtectedRoute />}>

              <Route path="report" element={<ReportIssue />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-tickets" element={<MyTickets />} />
              <Route path="settings" element={<Settings />} />
              <Route path="issue/:id" element={<IssueDetails />} />

            </Route>

          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;