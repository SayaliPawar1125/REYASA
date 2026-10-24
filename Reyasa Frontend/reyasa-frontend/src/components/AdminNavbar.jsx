
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import reyasaLogo from "../assets/logo.jpeg";

function AdminNavbar() {
  const navigate = useNavigate();

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
      label: "Products",
      path: "/admin/manageproducts",
      icon: "bi-box-seam",
    },
    
    {
      label: "Videos",
      path: "/admin/videos",
      icon: "bi-camera-video",
    },
    {
      label: "Enquiries",
      path: "/admin/enquiries",
      icon: "bi-envelope",
    },
    {
      label: "Admin Profile",
      path: "/admin/profile",
      icon: "bi-person-circle",
    },
  ];

  return (
    <nav className="navbar navbar-expand-xl navbar-dark admin-navbar">
      <div className="container-fluid px-3 px-lg-4">
        <Link
          to="/admin/dashboard"
          className="navbar-brand d-flex align-items-center gap-3 me-xl-3"
          style={{ textDecoration: "none" }}
        >
          <img
            src={reyasaLogo}
            alt="REYASA Logo"
            className="admin-navbar-logo"
          />

          <span className="d-flex flex-column">
            <span className="admin-brand-name">REYASA</span>
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

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#reyasaAdminNavbar"
          aria-controls="reyasaAdminNavbar"
          aria-expanded="false"
          aria-label="Toggle admin navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="collapse navbar-collapse"
          id="reyasaAdminNavbar"
        >
          <div className="navbar-nav ms-auto align-items-xl-center gap-xl-1 py-3 py-xl-0">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="nav-link text-white px-xl-2"
              >
                <i className={`bi ${item.icon} me-1`}></i>
                {item.label}
              </Link>
            ))}

            <Link
              to="/"
              className="btn btn-outline-light btn-sm px-3 mx-xl-2 mt-2 mt-xl-0"
            >
              <i className="bi bi-shop me-2"></i>
              View Store
            </Link>

            <button
              type="button"
              className="btn btn-danger btn-sm px-3 mt-2 mt-xl-0"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;
