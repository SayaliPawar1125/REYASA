import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import reyasaLogo from "../assets/logo.jpeg";

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("firstname");
    localStorage.removeItem("lastname");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    window.dispatchEvent(new Event("authChanged"));
    navigate("/login", { replace: true });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navLinks = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: "bi-speedometer2",
    },
    {
      label: "Orders",
      path: "/admin/orders",
      icon: "bi-bag-check",
    },
    {
      label: "Enquiries",
      path: "/admin/enquiries",
      icon: "bi-envelope",
    },
    {
      label: "Products",
      path: "/admin/manageproducts",
      icon: "bi-box-seam",
    },
    {
      label: "Material & Expenses",
      path: "/admin/expenses",
      icon: "bi-cash-stack",
    },
    {
      label: "Videos",
      path: "/admin/videos",
      icon: "bi-camera-video",
    },
    {
      label: "Delivery PIN Codes",
      path: "/admin/delivery-pincodes",
      icon: "bi-geo-alt",
    },
    {
      label: "About Us",
      path: "/admin/about",
      icon: "bi-info-circle",
    },
    {
      label: "Footer",
      path: "/admin/footer",
      icon: "bi-layout-text-window",
    },
  ];

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar navbar-dark admin-navbar">
        <div className="container-fluid px-3 px-lg-4">

          <div className="d-flex align-items-center gap-3">

            {/* LEFT SIDEBAR BUTTON */}
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin sidebar"
            >
              <i className="bi bi-list fs-4"></i>
            </button>

            {/* LOGO */}
            <Link
              to="/admin/dashboard"
              className="navbar-brand d-flex align-items-center gap-3 mb-0"
              style={{ textDecoration: "none" }}
            >
              <img
                src={reyasaLogo}
                alt="REYASA Logo"
                className="admin-navbar-logo"
              />

              <span className="d-flex flex-column">
                <span className="admin-brand-name">
                  REYASA
                </span>

                <small className="admin-brand-tagline">
                  SUSTAINABLE CLOTHING
                </small>

                <small
                  style={{
                    color: "#d8b4a0",
                    fontSize: "9px",
                    letterSpacing: "2px",
                    marginTop: "3px",
                  }}
                >
                  ADMIN PANEL
                </small>
              </span>
            </Link>
          </div>

          {/* ONLY THREE NAVBAR BUTTONS */}
          <div className="d-flex align-items-center gap-2">

            <Link
              to="/admin/dashboard"
              className="btn btn-outline-light btn-sm"
            >
              <i className="bi bi-speedometer2 me-1"></i>
              Dashboard
            </Link>

            <Link
              to="/"
              className="btn btn-outline-light btn-sm"
            >
              <i className="bi bi-shop me-1"></i>
              View Store
            </Link>

            <Link
              to="/admin/profile"
              className="btn btn-outline-light btn-sm"
            >
              <i className="bi bi-person-circle me-1"></i>
              Profile
            </Link>

          </div>
        </div>
      </nav>

      {/* SIDEBAR BACKDROP */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={closeSidebar}
        ></div>
      )}

      {/* LEFT SIDEBAR */}
      <div
        className="position-fixed top-0 start-0 h-100 bg-white shadow-lg"
        style={{
          width: "300px",
          maxWidth: "85%",
          zIndex: 1050,
          transform: sidebarOpen
            ? "translateX(0)"
            : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
          overflowY: "auto",
        }}
      >

        {/* SIDEBAR HEADER */}
        <div
          className="d-flex align-items-center justify-content-between p-3"
          style={{
            backgroundColor: "#142820",
            borderBottom: "3px solid #800000",
          }}
        >
          <div className="d-flex align-items-center gap-2">

            <img
              src={reyasaLogo}
              alt="REYASA Logo"
              width="45"
              height="45"
              className="rounded-circle"
            />

            <div>
              <h5 className="text-white fw-bold mb-0">
                REYASA
              </h5>

              <small className="text-white-50">
                ADMIN PANEL
              </small>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* SIDEBAR MENU */}
        <div className="p-3">

          <h6 className="text-secondary fw-bold mb-3">
            MANAGEMENT
          </h6>

          <div className="d-flex flex-column gap-2">

            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`d-flex align-items-center gap-3 p-3 rounded text-decoration-none ${
                  location.pathname === item.path
                    ? "text-white"
                    : "text-dark"
                }`}
                style={{
                  backgroundColor:
                    location.pathname === item.path
                      ? "#800000"
                      : "#f8f9fa",
                }}
              >
                <i className={`bi ${item.icon} fs-5`}></i>

                <span className="fw-semibold">
                  {item.label}
                </span>

                <i className="bi bi-chevron-right ms-auto"></i>
              </Link>
            ))}

          </div>

          <hr />

          {/* ADMIN PROFILE */}
          <Link
            to="/admin/profile"
            onClick={closeSidebar}
            className="d-flex align-items-center gap-3 p-3 rounded text-dark text-decoration-none"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <i className="bi bi-person-circle fs-5"></i>
            <span className="fw-semibold">Admin Profile</span>
          </Link>

          {/* VIEW STORE */}
          <Link
            to="/"
            onClick={closeSidebar}
            className="d-flex align-items-center gap-3 p-3 mt-2 rounded text-dark text-decoration-none"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <i className="bi bi-shop fs-5"></i>
            <span className="fw-semibold">View Store</span>
          </Link>

          {/* LOGOUT */}
          <button
            type="button"
            className="btn btn-danger w-100 mt-3"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>

        </div>
      </div>
    </>
  );
}

export default AdminNavbar;