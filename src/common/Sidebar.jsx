// import React, { useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import {
//   LayoutDashboard,
//   MapPin,
//   PlusCircle,
//   Ticket,
//   Settings,
//   Megaphone,
//   LogOut,
// } from "lucide-react";

// const Sidebar = () => {
//   const { user, logout } = useAuth();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [showProfileModal, setShowProfileModal] = useState(false);

//   const isActive = (path) => location.pathname === path;

//   const getInitials = (name) => {
//     if (!name) return "GU";
//     const parts = name.trim().split(" ");
//     if (parts.length === 1) {
//       return parts[0].slice(0, 2).toUpperCase();
//     }
//     return (parts[0][0] + parts[1][0]).toUpperCase();
//   };

//   const handleUserCardClick = () => {
//     setShowProfileModal(true);
//   };

//   return (
//     <>
//       <aside className="sidebar">
//         {/* Brand */}
//         <div className="sidebar-brand">
//           <div className="brand-icon-box">
//             <Megaphone size={22} color="#ffffff" />
//           </div>
//           <div>
//             <h1 className="brand-title">CityVoice</h1>
//             <p className="brand-subtitle">Smart Civic Grievance</p>
//           </div>
//         </div>

//         {/* Navigation */}
//         <nav className="sidebar-nav">
//           <Link
//             to="/dashboard"
//             className={`sidebar-link ${
//               isActive("/dashboard") ? "active" : ""
//             }`}
//           >
//             <LayoutDashboard size={20} />
//             <span>Dashboard</span>
//           </Link>

//           <Link
//             to="/"
//             className={`sidebar-link ${
//               isActive("/") ? "active" : ""
//             }`}
//           >
//             <MapPin size={20} />
//             <span>Map & Feed</span>
//           </Link>

//           {user && user.role === "citizen" && (
//             <Link
//               to="/report"
//               className={`sidebar-link ${
//                 isActive("/report") ? "active" : ""
//               }`}
//             >
//               <PlusCircle size={20} />
//               <span>Report Issue</span>
//             </Link>
//           )}

//           <Link
//             to="/my-tickets"
//             className={`sidebar-link ${
//               isActive("/my-tickets") ? "active" : ""
//             }`}
//           >
//             <Ticket size={20} />
//             <span>My Tickets</span>
//           </Link>

//           <Link
//             to="/settings"
//             className={`sidebar-link ${
//               isActive("/settings") ? "active" : ""
//             }`}
//           >
//             <Settings size={20} />
//             <span>Settings</span>
//           </Link>
//         </nav>

//         {/* Bottom User Card */}
//         <div className="sidebar-footer">
//           <div
//             className="user-profile-card"
//             onClick={handleUserCardClick}
//           >
//             <div className="user-avatar-circle">
//               {getInitials(user?.name)}
//             </div>

//             <div className="user-profile-info">
//               <span className="profile-name">
//                 {user ? user.name : "Guest User"}
//               </span>

//               <span className="profile-role">
//                 {user ? user.role : "CITIZEN (Click to view)"}
//               </span>
//             </div>
//           </div>
//         </div>
//       </aside>

//       {/* User Profile Modal */}
//       {showProfileModal && (
//         <div
//           className="modal-overlay"
//           onClick={() => setShowProfileModal(false)}
//         >
//           <div
//             className="profile-modal"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <button
//               className="modal-close-btn"
//               onClick={() => setShowProfileModal(false)}
//             >
//               ✕
//             </button>

//             <div className="modal-avatar-big">
//               {getInitials(user?.name)}
//             </div>

//             <h3 style={{ fontSize: "1.3rem", fontWeight: "800" }}>
//               {user ? user.name : "Guest Citizen"}
//             </h3>

//             <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0.2rem 0 1rem 0" }}>
//               {user ? user.email : "Not signed in yet"}
//             </p>

//             <div
//               style={{
//                 background: "#f8fafc",
//                 padding: "1rem",
//                 borderRadius: "12px",
//                 textAlign: "left",
//                 marginBottom: "1.2rem",
//               }}
//             >
//               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
//                 <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Role:</span>
//                 <span className="role-badge">{user ? user.role : "GUEST"}</span>
//               </div>

//               <div style={{ display: "flex", justifyContent: "space-between" }}>
//                 <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Account Status:</span>
//                 <span style={{ color: "#16a34a", fontWeight: "700", fontSize: "0.85rem" }}>
//                   Active Verified
//                 </span>
//               </div>
//             </div>

//             {user ? (
//               <button
//                 onClick={() => {
//                   logout();
//                   setShowProfileModal(false);
//                   navigate("/signin");
//                 }}
//                 className="btn-submit"
//                 style={{
//                   background: "#ef4444",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   gap: "0.5rem",
//                 }}
//               >
//                 <LogOut size={18} />
//                 Sign Out
//               </button>
//             ) : (
//               <button
//                 onClick={() => {
//                   setShowProfileModal(false);
//                   navigate("/signin");
//                 }}
//                 className="btn-submit"
//               >
//                 Sign In / Register
//               </button>
//             )}
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default Sidebar;