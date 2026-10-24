import React, { useState } from "react";
import { Link } from "react-router-dom";
import heroBackground from "../assets/reyasa-background.png";

function ForgotPassword() {
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Track steps: 1 = Enter Email, 2 = Verify OTP & Reset Password, 3 = Success
  const [step, setStep] = useState(1);

  // Step 1: Handle Requesting OTP
  const handleRequestOtp = (e) => {
    e.preventDefault();
    // Integration: Post to your FastAPI endpoint to send OTP
    setStep(2);
  };

  // Step 2: Handle Verifying OTP and updating password
  const handleVerifyAndReset = (e) => {
    e.preventDefault();
    // Integration: Post OTP + New Password to FastAPI endpoint
    setStep(3);
  };

  return (
    <section
      className="min-vh-100 d-flex align-items-center py-5"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
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
                WebkitBackdropFilter: "blur(8px)"
              }}
            >
              <div className="card-body p-4 p-md-5">
                {/* REYASA HEADER */}
                <div className="text-center mb-4">
                  
                  <h3 className="text-white mt-3">Reset Password</h3>
                  <p className="text-white-50 small px-3">
                    {step === 1 && "Enter your email address to receive a 6-digit verification code."}
                    {step === 2 && `Enter the OTP sent to ${email} and create your new password.`}
                    {step === 3 && "Your password has been successfully updated."}
                  </p>
                </div>

                {/* ROLE SELECTOR (Hide if already verified or successful) */}
                {step === 1 && (
                  <div className="btn-group w-100 mb-4">
                    <button
                      type="button"
                      className={role === "customer" ? "btn btn-light" : "btn btn-outline-light"}
                      onClick={() => setRole("customer")}
                    >
                      <i className="bi bi-person me-2"></i> Customer
                    </button>
                    <button
                      type="button"
                      className={role === "admin" ? "btn btn-light" : "btn btn-outline-light"}
                      onClick={() => setRole("admin")}
                    >
                      <i className="bi bi-shield-lock me-2"></i> Admin
                    </button>
                  </div>
                )}

                {/* STEP 1: REQUEST OTP */}
                {step === 1 && (
                  <form onSubmit={handleRequestOtp}>
                    <div className="mb-4">
                      <label className="form-label text-white">Registered Email</label>
                      <input
                        type="email"
                        className="form-control bg-transparent text-white border-light placeholder-white-50"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-light w-100 mb-3">
                      <i className="bi bi-chat-left-dots me-2"></i> SEND OTP CODE
                    </button>
                  </form>
                )}

                {/* STEP 2: ENTER OTP & NEW PASSWORD */}
                {step === 2 && (
                  <form onSubmit={handleVerifyAndReset}>
                    <div className="mb-3">
                      <label className="form-label text-white">Verification Code (OTP)</label>
                      <input
                        type="text"
                        maxLength="6"
                        className="form-control bg-transparent text-white border-light placeholder-white-50 text-center fs-4 letter-spacing-custom"
                        placeholder="0 0 0 0 0 0"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Only digits
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label text-white">New Password</label>
                      <input
                        type="password"
                        className="form-control bg-transparent text-white border-light placeholder-white-50"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-light w-100 mb-2">
                      <i className="bi bi-shield-check me-2"></i> RESET PASSWORD
                    </button>
                    <div className="text-center mb-3">
                      <button 
                        type="button" 
                        className="btn btn-link text-white-50 btn-sm text-decoration-none"
                        onClick={() => setStep(1)}
                      >
                        Change Email Address
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: SUCCESS STATE */}
                {step === 3 && (
                  <div className="text-center my-4 p-3 bg-white bg-opacity-10 rounded-3 border border-light border-opacity-25">
                    <i className="bi bi-check-circle-fill text-success fs-1 mb-2 d-block"></i>
                    <h5 className="text-white fw-semibold">Password Changed!</h5>
                    <p className="text-white-50 small mb-0">
                      Your {role} password has been updated. You can now log in securely.
                    </p>
                  </div>
                )}

                {/* BACK TO LOGIN */}
                <div className="text-center mt-3">
                  <Link to="/login" className="text-white fw-semibold text-decoration-none">
                    <i className="bi bi-arrow-left me-2"></i> Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
