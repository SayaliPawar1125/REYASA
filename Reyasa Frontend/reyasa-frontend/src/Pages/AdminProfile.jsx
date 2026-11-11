
import React, { useEffect, useState } from "react";
import reyasaBackground from "../assets/reyasa-background.png";

function AdminProfile() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const maroon = "#800000";

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      setError("");

      if (!token) {
        setError("Please log in again to access your admin profile.");
        setProfileLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:8080/api/admin/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load admin profile."
          );
        }

        const fullName = (data.name || "").trim().split(/\s+/);

        setProfile({
          firstName: data.firstName || fullName[0] || "",
          lastName:
            data.lastName ||
            (data.name ? fullName.slice(1).join(" ") : ""),
          email: data.email || "",
        });
      } catch (err) {
        setError(err.message || "Unable to load admin profile.");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e5d8d0",
    borderRadius: "16px",
  };

  const detailStyle = {
    backgroundColor: "#faf7f5",
    border: "1px solid #eee3dc",
    borderRadius: "10px",
    padding: "14px 16px",
    minHeight: "58px",
  };

  return (
    <main
      className="container-fluid min-vh-100 px-3 px-md-4 pb-4"
      style={{
        paddingTop: "110px",
        backgroundImage: `url(${reyasaBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container" style={{ maxWidth: "900px" }}>

        {/* Page heading */}
        <div className="mb-4">
          <p
            className="text-uppercase fw-bold mb-2"
            style={{
              color: maroon,
              letterSpacing: "4px",
              fontSize: "12px",
            }}
          >
            Account Settings
          </p>

          <h1 className="fw-bold mb-2" style={{ color: maroon }}>
            Admin Profile
          </h1>

          <p className="fw-semibold mb-0" style={{ color: maroon }}>
            View your REYASA administrator account information.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="alert alert-warning shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Loading */}
        {profileLoading ? (
          <div className="card shadow-sm border-0" style={cardStyle}>
            <div className="card-body text-center py-5">
              <div
                className="spinner-border"
                style={{ color: maroon }}
                role="status"
              >
                <span className="visually-hidden">
                  Loading profile...
                </span>
              </div>

              <p className="text-secondary mt-3 mb-0">
                Loading your profile...
              </p>
            </div>
          </div>
        ) : !error ? (

          /* Profile Information */
          <div className="card shadow-sm border-0" style={cardStyle}>
            <div className="card-body p-4 p-md-5">

              {/* Card heading */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "55px",
                    height: "55px",
                    backgroundColor: "#f4e8e8",
                    color: maroon,
                    flexShrink: 0,
                  }}
                >
                  <i className="bi bi-person-circle fs-2"></i>
                </div>

                <div>
                  <h4 className="fw-bold mb-1">
                    Profile Information
                  </h4>

                  <p className="text-secondary small mb-0">
                    Your administrator account details.
                  </p>
                </div>
              </div>

              {/* First Name */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  First Name
                </label>

                <div
                  className="d-flex align-items-center"
                  style={detailStyle}
                >
                  <span className="fw-medium">
                    {profile.firstName || "Not available"}
                  </span>
                </div>
              </div>

              {/* Last Name */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Last Name
                </label>

                <div
                  className="d-flex align-items-center"
                  style={detailStyle}
                >
                  <span className="fw-medium">
                    {profile.lastName || "Not available"}
                  </span>
                </div>
              </div>

              {/* Email Address */}
              <div className="mb-0">
                <label className="form-label fw-semibold">
                  Email Address
                </label>

                <div
                  className="d-flex align-items-center"
                  style={detailStyle}
                >
                  <span className="fw-medium">
                    {profile.email || "Not available"}
                  </span>
                </div>
              </div>

            </div>
          </div>

        ) : null}

        {/* Footer */}
        <footer className="text-center py-4">
          <small
            className="fw-semibold"
            style={{
              color: maroon,
              letterSpacing: "2px",
            }}
          >
            REYASA · CREATED WITH PASSION. WORN WITH LOVE.
          </small>
        </footer>

      </div>
    </main>
  );
}

export default AdminProfile;
