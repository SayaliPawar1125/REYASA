
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import EnquiryServices from "../services/EnquiryService";
import heroBackground from "../assets/reyasa-background.png";

function Enquiry() {
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    productName: searchParams.get("product") || "",
    customerName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await EnquiryServices.submitEnquiry(formData);

      setSuccess(
        response.data?.message ||
          "Your enquiry has been submitted successfully."
      );

      setFormData({
        productName: "",
        customerName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      const validationErrors = err.response?.data?.errors;

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          (validationErrors
            ? Object.values(validationErrors).join(", ")
            : "") ||
          "Unable to submit your enquiry. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="position-relative py-5"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
      }}
    >
      <div className="container position-relative py-3 py-lg-5">
        {/* PAGE HEADING */}
        <div className="text-center mb-5">
          <p className="text-uppercase fw-semibold small mb-3">
            REYASA | Created with passion. Worn with love.
          </p>

          <h1 className="display-4 fw-bold mb-3">
            We're Here to Help
          </h1>

          <p className="lead mb-0">
            Your questions matter to us. Let's connect.
          </p>
        </div>

        {/* INFORMATION AND ENQUIRY CARDS */}
        <div className="row justify-content-center g-4">
          {/* LEFT INFORMATION CARD */}
          <div className="col-12 col-lg-4">
            <div className="card h-100 border-0 shadow-lg rounded-4">
              <div className="card-body p-4 p-xl-5">
                <span className="badge rounded-pill text-bg-dark mb-3 px-3 py-2">
                  CUSTOMER SUPPORT
                </span>

                <h2 className="h3 fw-bold mb-3">
                  Let's Talk
                </h2>

                <p className="text-secondary mb-4">
                  Need help with your favourite shirt, sizing,
                  product details, or a limited-edition collection?
                  Send your question to the REYASA team.
                </p>

                <hr className="my-4" />

                <div className="d-flex align-items-start gap-3 mb-4">
                  <div className="bg-light rounded-3 p-3 flex-shrink-0">
                    <i className="bi bi-chat-dots fs-4"></i>
                  </div>

                  <div>
                    <h3 className="h6 fw-bold mb-2">
                      Product Enquiries
                    </h3>
                    <p className="text-secondary small mb-0">
                      Ask about shirts, sizes, prices, and
                      collections.
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 mb-4">
                  <div className="bg-light rounded-3 p-3 flex-shrink-0">
                    <i className="bi bi-person-check fs-4"></i>
                  </div>

                  <div>
                    <h3 className="h6 fw-bold mb-2">
                      Customer Assistance
                    </h3>
                    <p className="text-secondary small mb-0">
                      Tell us about your question or concern.
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="bg-light rounded-3 p-3 flex-shrink-0">
                    <i className="bi bi-envelope-paper fs-4"></i>
                  </div>

                  <div>
                    <h3 className="h6 fw-bold mb-2">
                      Your Message
                    </h3>
                    <p className="text-secondary small mb-0">
                      Your enquiry can be reviewed by the
                      REYASA admin team.
                    </p>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="fw-bold mb-1">REYASA</p>
                  <p className="small text-secondary mb-0">
                    Created with passion. Worn with love.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT ENQUIRY FORM CARD */}
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-4 p-md-5">
                <div className="mb-4">
                  <p className="text-uppercase text-secondary small fw-semibold mb-2">
                    We'd love to hear from you
                  </p>

                  <h2 className="h3 fw-bold mb-2">
                    Send an Enquiry
                  </h2>

                  <p className="text-secondary mb-0">
                    Complete the form below and share your
                    question with us.
                  </p>
                </div>

                {success && (
                  <div
                    className="alert alert-success"
                    role="alert"
                  >
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {success}
                  </div>
                )}

                {error && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                  >
                    <i className="bi bi-exclamation-circle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* PRODUCT */}
                  <div className="mb-3">
                    <label
                      htmlFor="productName"
                      className="form-label fw-semibold"
                    >
                      Product / Collection
                      <span className="text-secondary fw-normal">
                        {" "}(Optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="productName"
                      name="productName"
                      placeholder="Enter product or collection name"
                      value={formData.productName}
                      onChange={handleChange}
                      maxLength={150}
                    />
                  </div>

                  {/* CUSTOMER NAME */}
                  <div className="mb-3">
                    <label
                      htmlFor="customerName"
                      className="form-label fw-semibold"
                    >
                      Full Name *
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      id="customerName"
                      name="customerName"
                      placeholder="Enter your full name"
                      value={formData.customerName}
                      onChange={handleChange}
                      autoComplete="name"
                      maxLength={100}
                      required
                    />
                  </div>

                  {/* EMAIL AND PHONE */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label
                        htmlFor="email"
                        className="form-label fw-semibold"
                      >
                        Email Address *
                      </label>

                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        maxLength={150}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label
                        htmlFor="phone"
                        className="form-label fw-semibold"
                      >
                        Phone Number *
                      </label>

                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={handleChange}
                        autoComplete="tel"
                        minLength={10}
                        maxLength={20}
                        required
                      />
                    </div>
                  </div>

                  {/* MESSAGE */}
                  <div className="mb-4">
                    <label
                      htmlFor="message"
                      className="form-label fw-semibold"
                    >
                      Your Message *
                    </label>

                    <textarea
                      className="form-control"
                      id="message"
                      name="message"
                      rows="5"
                      placeholder="Tell us how we can help..."
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={2000}
                      required
                    ></textarea>

                    <div className="form-text text-end">
                      {formData.message.length}/2000 characters
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    className="btn btn-dark btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>
                        Submitting Enquiry...
                      </>
                    ) : (
                      <>
                        Submit Enquiry
                        <i className="bi bi-arrow-right ms-2"></i>
                      </>
                    )}
                  </button>

                  <p className="text-secondary small text-center mt-3 mb-0">
                    Thank you for connecting with REYASA.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BRAND MESSAGE */}
        <div className="text-center mt-5">
          <p className="fw-semibold mb-1">
            Made for your style. Made for you.
          </p>
          <p className="small mb-0">
            REYASA — Created with passion. Worn with love.
          </p>
        </div>
      </div>
    </main>
  );
}

export default Enquiry;
