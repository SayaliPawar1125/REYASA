
import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import heroBackground from "../assets/reyasa-background.png";

const API_URL = "http://localhost:8080/api/auth/forgot-password";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 1 = Enter Email
  // 2 = Verify OTP and Reset Password
  // 3 = Success
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // STEP 1: REQUEST OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/request-otp`,
        {
          email: email.trim().toLowerCase(),
        }
      );

      setMessage(
        response.data.message ||
        "OTP request submitted. Please check your email."
      );

      setStep(2);

    } catch (err) {
      console.error("OTP Request Error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to send OTP. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP AND RESET PASSWORD
  const handleVerifyAndReset = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/reset`,
        {
          email: email.trim().toLowerCase(),
          otp: otp,
          newPassword: newPassword,
        }
      );

      setMessage(
        response.data.message ||
        "Password reset successfully."
      );

      setStep(3);

      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error("Password Reset Error:", err);

      setError(
        err.response?.data?.message ||
        "Invalid or expired OTP. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // CHANGE EMAIL
  const handleChangeEmail = () => {
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
  };

  return (
    <section
      className="min-vh-100 d-flex align-items-center py-5"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">

            <div
              className="card border-0 shadow-lg rounded-4 text-white"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <div className="card-body p-4 p-md-5">

                {/* HEADER */}
                <div className="text-center mb-4">

                  <h3 className="text-white mt-3">
                    Reset Password
                  </h3>

                  <p className="text-white-50 small px-3">

                    {step === 1 &&
                      "Enter your registered email address to receive a 6-digit verification code."}

                    {step === 2 &&
                      `Enter the OTP sent to ${email} and create your new password.`}

                    {step === 3 &&
                      "Your password has been successfully updated."}

                  </p>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                  <div className="alert alert-danger text-center py-2">
                    {error}
                  </div>
                )}

                {/* SUCCESS / INFO MESSAGE */}
                {message && (
                  <div className="alert alert-info text-center py-2">
                    {message}
                  </div>
                )}

                {/* STEP 1: ENTER EMAIL */}
                {step === 1 && (

                  <form onSubmit={handleRequestOtp}>

                    <div className="mb-4">

                      <label className="form-label text-white">
                        Registered Email
                      </label>

                      <input
                        type="email"
                        className="form-control bg-transparent text-white border-light"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />

                    </div>

                    <button
                      type="submit"
                      className="btn btn-light w-100 mb-3"
                      disabled={loading}
                    >

                      <i className="bi bi-chat-left-dots me-2"></i>

                      {loading ? "SENDING..." : "SEND OTP CODE"}

                    </button>

                  </form>
                )}

                {/* STEP 2: VERIFY OTP AND RESET */}
                {step === 2 && (

                  <form onSubmit={handleVerifyAndReset}>

                    {/* OTP */}
                    <div className="mb-3">

                      <label className="form-label text-white">
                        Verification Code (OTP)
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="form-control bg-transparent text-white border-light text-center fs-4"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) =>
                          setOtp(
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6)
                          )
                        }
                        required
                      />

                    </div>

                    {/* NEW PASSWORD */}
                    <div className="mb-3">

                      <label className="form-label text-white">
                        New Password
                      </label>

                      <input
                        type="password"
                        className="form-control bg-transparent text-white border-light"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(e.target.value)
                        }
                        minLength={8}
                        required
                      />

                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div className="mb-4">

                      <label className="form-label text-white">
                        Confirm New Password
                      </label>

                      <input
                        type="password"
                        className="form-control bg-transparent text-white border-light"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        minLength={8}
                        required
                      />

                    </div>

                    {/* RESET BUTTON */}
                    <button
                      type="submit"
                      className="btn btn-light w-100 mb-2"
                      disabled={loading}
                    >

                      <i className="bi bi-shield-check me-2"></i>

                      {loading ? "RESETTING..." : "RESET PASSWORD"}

                    </button>

                    {/* CHANGE EMAIL */}
                    <div className="text-center mb-3">

                      <button
                        type="button"
                        className="btn btn-link text-white-50 btn-sm text-decoration-none"
                        onClick={handleChangeEmail}
                      >
                        Change Email Address
                      </button>

                    </div>

                  </form>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 3 && (

                  <div className="text-center my-4 p-3 bg-white bg-opacity-10 rounded-3 border border-light border-opacity-25">

                    <i className="bi bi-check-circle-fill text-success fs-1 mb-2 d-block"></i>

                    <h5 className="text-white fw-semibold">
                      Password Changed!
                    </h5>

                    <p className="text-white-50 small mb-0">
                      Your password has been successfully updated.
                      You can now log in securely.
                    </p>

                    <Link
                      to="/login"
                      className="btn btn-light w-100 mt-4"
                    >
                      GO TO LOGIN
                    </Link>

                  </div>
                )}

                {/* BACK TO LOGIN */}
                {step !== 3 && (

                  <div className="text-center mt-3">

                    <Link
                      to="/login"
                      className="text-white fw-semibold text-decoration-none"
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Back to Login
                    </Link>

                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
