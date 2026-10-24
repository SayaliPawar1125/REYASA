
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import heroBackground from "../assets/reyasa-background.png";
import AuthService from "../services/AuthService";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateName = (value, fieldName) => {
    const name = value.trim();

    if (!name) {
      return `${fieldName} is required.`;
    }

    if (name.length < 2 || name.length > 50) {
      return `${fieldName} must be between 2 and 50 characters.`;
    }

    const namePattern =
      /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;

    if (!namePattern.test(name)) {
      return `${fieldName} can contain letters, spaces, hyphens and apostrophes only.`;
    }

    return "";
  };

  const validateEmail = (value) => {
    const email = value.trim();

    if (!email) {
      return "Email is required.";
    }

    if (email.length > 254) {
      return "Email must not exceed 254 characters.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address.";
    }

    return "";
  };

  const validatePhone = (value) => {
    if (!value) {
      return "Mobile number is required.";
    }

    if (!/^[6-9]\d{9}$/.test(value)) {
      return "Enter a valid 10-digit Indian mobile number starting with 6–9.";
    }

    return "";
  };

  const validatePassword = (value) => {
    if (!value) {
      return "Password is required.";
    }

    if (value.length < 8 || value.length > 64) {
      return "Password must contain 8 to 64 characters.";
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S+$/.test(value)) {
      return "Password must include uppercase, lowercase, number and special character, without spaces.";
    }

    return "";
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return "Please confirm your password.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const validateForm = () => {
    const errors = {
      firstName: validateName(formData.firstName, "First name"),
      lastName: validateName(formData.lastName, "Last name"),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(
        formData.password,
        formData.confirmPassword
      ),
    };

    Object.keys(errors).forEach((key) => {
      if (!errors[key]) {
        delete errors[key];
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));

    setErrorMessage("");

    setFieldErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
      ...(name === "password" ? { confirmPassword: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      setErrorMessage("Please correct the highlighted fields.");
      return;
    }

    const userData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone,
      password: formData.password,
    };

    try {
      setLoading(true);

      const response = await AuthService.register(userData);

      alert(
        response.data?.message ||
          "Registration successful! Please login."
      );

      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);

      const data = error.response?.data;

      if (data?.errors && typeof data.errors === "object") {
        setFieldErrors((previousErrors) => ({
          ...previousErrors,
          ...data.errors,
        }));
      }

      const backendMessage =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.error ||
            data?.detail;

      setErrorMessage(
        backendMessage ||
          (error.response?.status === 409
            ? "An account with this email already exists."
            : error.response
              ? "Registration failed. Please check your details."
              : "Cannot connect to the backend. Check Spring Boot and your CORS configuration.")
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `form-control bg-transparent text-white border-light ${
      fieldErrors[field] ? "is-invalid" : ""
    }`;

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
                <div className="text-center mb-4">
                  <h3 className="text-white mt-3 fw-bold">
                    Create Account
                  </h3>

                  <p className="text-white-50 small">
                    Join REYASA Shop for faster checkout and order tracking
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {/* First Name */}
                  <div className="mb-3">
                    <label
                      htmlFor="firstName"
                      className="form-label text-white small fw-medium"
                    >
                      First Name
                    </label>

                    <input
                      id="firstName"
                      type="text"
                      className={inputClass("firstName")}
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                      autoComplete="given-name"
                      minLength={2}
                      maxLength={50}
                      required
                      aria-invalid={Boolean(fieldErrors.firstName)}
                      aria-describedby="firstNameError"
                    />

                    {fieldErrors.firstName && (
                      <div id="firstNameError" className="invalid-feedback">
                        {fieldErrors.firstName}
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="mb-3">
                    <label
                      htmlFor="lastName"
                      className="form-label text-white small fw-medium"
                    >
                      Last Name
                    </label>

                    <input
                      id="lastName"
                      type="text"
                      className={inputClass("lastName")}
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      autoComplete="family-name"
                      minLength={2}
                      maxLength={50}
                      required
                      aria-invalid={Boolean(fieldErrors.lastName)}
                      aria-describedby="lastNameError"
                    />

                    {fieldErrors.lastName && (
                      <div id="lastNameError" className="invalid-feedback">
                        {fieldErrors.lastName}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label text-white small fw-medium"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      className={inputClass("email")}
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      autoComplete="email"
                      maxLength={254}
                      required
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby="emailError"
                    />

                    {fieldErrors.email && (
                      <div id="emailError" className="invalid-feedback">
                        {fieldErrors.email}
                      </div>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div className="mb-3">
                    <label
                      htmlFor="phone"
                      className="form-label text-white small fw-medium"
                    >
                      Mobile Number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      className={inputClass("phone")}
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter 10 digit mobile number"
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel"
                      required
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby="phoneError"
                    />

                    {fieldErrors.phone && (
                      <div id="phoneError" className="invalid-feedback">
                        {fieldErrors.phone}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label
                      htmlFor="password"
                      className="form-label text-white small fw-medium"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      className={inputClass("password")}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      minLength={8}
                      maxLength={64}
                      autoComplete="new-password"
                      required
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby="passwordError"
                    />

                    {fieldErrors.password && (
                      <div id="passwordError" className="invalid-feedback">
                        {fieldErrors.password}
                      </div>
                    )}

                    <small className="text-white-50">
                      Use 8–64 characters with uppercase, lowercase, a number
                      and a special character. No spaces.
                    </small>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label
                      htmlFor="confirmPassword"
                      className="form-label text-white small fw-medium"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="confirmPassword"
                      type="password"
                      className={inputClass("confirmPassword")}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      required
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby="confirmPasswordError"
                    />

                    {fieldErrors.confirmPassword && (
                      <div
                        id="confirmPasswordError"
                        className="invalid-feedback"
                      >
                        {fieldErrors.confirmPassword}
                      </div>
                    )}
                  </div>

                  {/* Backend Error */}
                  {errorMessage && (
                    <div className="alert alert-danger py-2" role="alert">
                      {errorMessage}
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    type="submit"
                    className="btn btn-light w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>
                        Registering...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        REGISTER &amp; SHOP
                      </>
                    )}
                  </button>
                </form>

                {/* Login Link */}
                <div className="text-center mt-4 pt-2 border-top border-secondary">
                  <p className="text-white-50 small mb-1">
                    Already have an account?
                  </p>

                  <Link
                    to="/login"
                    className="text-white fw-semibold small text-decoration-none"
                  >
                    Sign In Here
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

export default Register;
