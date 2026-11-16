import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 🌟 Top Navbar instead of Left Sidebar */}
      <Navbar />

      <main style={{ flex: 1, padding: "1.5rem" }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;