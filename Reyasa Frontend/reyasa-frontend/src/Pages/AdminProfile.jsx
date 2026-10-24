
import React, { useEffect, useState } from "react";
import reyasaBackground from "../assets/reyasa-background.png";

function AdminProfile() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [message, setMessage] = useState("");
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
          throw new Error(data.message || "Unable to load admin profile.");
        }

        const fullName = (data.name || "").trim().split(/\s+/);

        setProfile({
          firstName: data.firstName || fullName[0] || "",
          lastName:
            data.lastName || (data.name ? fullName.slice(1).join(" ") : ""),
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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    if (
      !profile.firstName.trim() ||
      !profile.lastName.trim() ||
      !profile.email.trim()
    ) {
      setError("Please enter your first name, last name, and email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/admin/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            email: profile.email.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      if (data && (data.firstName || data.lastName || data.email)) {
        setProfile((previous) => ({
          firstName: data.firstName ?? previous.firstName,
          lastName: data.lastName ?? previous.lastName,
          email: data.email ?? previous.email,
        }));
      }

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/admin/profile/password",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to change password.");
      }

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err.message || "Unable to change password.");
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e5d8d0",
    borderRadius: "16px",
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
            Manage your REYASA administrator account and security.
          </p>
        </div>

        {message && (
          <div className="alert alert-success shadow-sm" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-warning shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {profileLoading ? (
          <div className="card shadow-sm border-0" style={cardStyle}>
            <div className="card-body text-center py-5">
              <div
                className="spinner-border"
                style={{ color: maroon }}
                role="status"
              >
                <span className="visually-hidden">Loading profile...</span>
              </div>
              <p className="text-secondary mt-3 mb-0">
                Loading your profile...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Profile information */}
            <div className="card shadow-sm border-0 mb-4" style={cardStyle}>
              <div className="card-body p-4 p-md-5">
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
                    <h4 className="fw-bold mb-1">Profile Information</h4>
                    <p className="text-secondary small mb-0">
                      Update your name and email address.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div className="mb-3">
                    <label htmlFor="adminFirstName" className="form-label fw-semibold">
                      First Name
                    </label>
                    <input
                      id="adminFirstName"
                      type="text"
                      name="firstName"
                      className="form-control form-control-lg"
                      placeholder="Enter first name"
                      value={profile.firstName}
                      onChange={handleProfileChange}
                      autoComplete="given-name"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="adminLastName" className="form-label fw-semibold">
                      Last Name
                    </label>
                    <input
                      id="adminLastName"
                      type="text"
                      name="lastName"
                      className="form-control form-control-lg"
                      placeholder="Enter last name"
                      value={profile.lastName}
                      onChange={handleProfileChange}
                      autoComplete="family-name"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="adminEmail" className="form-label fw-semibold">
                      Email Address
                    </label>
                    <input
                      id="adminEmail"
                      type="email"
                      name="email"
                      className="form-control form-control-lg"
                      placeholder="Enter your email address"
                      value={profile.email}
                      onChange={handleProfileChange}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn px-4 py-2 text-white"
                    style={{ backgroundColor: maroon }}
                    disabled={loading}
                  >
                    <i className="bi bi-floppy me-2"></i>
                    {loading ? "Saving..." : "Save Profile"}
                  </button>
                </form>
              </div>
            </div>

            {/* Change password */}
            <div className="card shadow-sm border-0" style={cardStyle}>
              <div className="card-body p-4 p-md-5">
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
                    <i className="bi bi-shield-lock fs-2"></i>
                  </div>

                  <div>
                    <h4 className="fw-bold mb-1">Change Password</h4>
                    <p className="text-secondary small mb-0">
                      Keep your administrator account secure.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword}>
                  <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label fw-semibold">
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      name="currentPassword"
                      className="form-control form-control-lg"
                      placeholder="Enter current password"
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label fw-semibold">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      name="newPassword"
                      className="form-control form-control-lg"
                      placeholder="Enter new password"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      className="form-control form-control-lg"
                      placeholder="Confirm new password"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn px-4 py-2 text-white"
                    style={{ backgroundColor: maroon }}
                    disabled={loading}
                  >
                    <i className="bi bi-key me-2"></i>
                    {loading ? "Processing..." : "Change Password"}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        <footer className="text-center py-4">
          <small
            className="fw-semibold"
            style={{ color: maroon, letterSpacing: "2px" }}
          >
            REYASA · CREATED WITH PASSION. WORN WITH LOVE.
          </small>
        </footer>
      </div>
    </main>
  );
}

export default AdminProfile;
