import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import EnquiryServices from "../services/EnquiryService";
import heroBackground from "../assets/reyasa-background.png";

const MAROON = "#800000";

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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const response = await EnquiryServices.submitEnquiry(formData);

      await Swal.fire({
        icon: "success",
        title: "Thank You!",
        text:
          response.data?.message ||
          "Your enquiry has been submitted successfully. Our REYASA team will get back to you.",
        confirmButtonText: "Continue Shopping",
        confirmButtonColor: MAROON,
        background: "#fffaf7",
        color: "#252525",
        width: "420px",
        padding: "2.5rem 2rem",
        customClass: {
          popup: "reyasa-popup",
          title: "reyasa-popup-title",
          htmlContainer: "reyasa-popup-message",
          confirmButton: "reyasa-popup-button",
        },
        buttonsStyling: true,
        allowOutsideClick: false,
      });

      setFormData({
        productName: "",
        customerName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      const responseData = err.response?.data;
      const validationErrors = responseData?.errors;

      const errorMessage =
        responseData?.detail ||
        responseData?.message ||
        responseData?.error ||
        (validationErrors
          ? Object.values(validationErrors).join(", ")
          : "") ||
        "We couldn't submit your enquiry right now. Please try again.";

      await Swal.fire({
        icon: "error",
        title: "Oops! Something Went Wrong",
        text: errorMessage,
        confirmButtonText: "Try Again",
        confirmButtonColor: MAROON,
        background: "#fffaf7",
        color: "#252525",
        width: "420px",
        padding: "2.5rem 2rem",
        customClass: {
          popup: "reyasa-popup",
          title: "reyasa-popup-title",
          htmlContainer: "reyasa-popup-message",
          confirmButton: "reyasa-popup-button",
        },
        buttonsStyling: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="min-vh-100 pb-4"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll",
        paddingTop: "70px",      }}
    >
      <div className="container">

        {/* PAGE HEADING */}
        <div className="mb-3">
          <h1
            className="fw-bold mb-2"
            style={{
              color: MAROON,
              fontSize: "clamp(2rem, 4vw, 2.7rem)",
              textShadow: "0 1px 2px rgba(255,255,255,0.5)",
            }}
          >
            <i className="bi bi-envelope-paper me-2"></i>
            Contact &amp; Enquiries
          </h1>

          <p
            className="fw-semibold mb-0"
            style={{
              color: MAROON,
              fontSize: "1rem",
            }}
          >
            Have a question about REYASA? We're here to help.
          </p>
        </div>

        {/* INFORMATION AND FORM CARDS */}
        <div className="row justify-content-center g-3">

          {/* LEFT INFORMATION CARD */}
          <div className="col-12 col-md-5 col-lg-4">
            <div className="card h-100 border-0 shadow rounded-3">
              <div className="card-body p-3 p-lg-4">

                <span className="badge rounded-pill text-bg-dark mb-3 px-3 py-2">
                  CUSTOMER SUPPORT
                </span>

                <h2 className="h4 fw-bold mb-3">
                  Let's Talk
                </h2>

                <p className="text-secondary small mb-3">
                  Need help with your favourite shirt, sizing,
                  product details, or a limited-edition collection?
                  Send your question to the REYASA team.
                </p>

                <hr className="my-3" />

                <div className="d-flex align-items-start gap-3 mb-3">
                  <div className="bg-light rounded-3 p-2 flex-shrink-0">
                    <i className="bi bi-chat-dots fs-5"></i>
                  </div>

                  <div>
                    <h3 className="h6 fw-bold mb-1">
                      Product Enquiries
                    </h3>

                    <p className="text-secondary small mb-0">
                      Ask about shirts, sizes, prices, and collections.
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 mb-3">
                  <div className="bg-light rounded-3 p-2 flex-shrink-0">
                    <i className="bi bi-person-check fs-5"></i>
                  </div>

                  <div>
                    <h3 className="h6 fw-bold mb-1">
                      Customer Assistance
                    </h3>

                    <p className="text-secondary small mb-0">
                      Tell us about your question or concern.
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="bg-light rounded-3 p-2 flex-shrink-0">
                    <i className="bi bi-envelope-paper fs-5"></i>
                  </div>

                  <div>
                    <h3 className="h6 fw-bold mb-1">
                      Your Message
                    </h3>

                    <p className="text-secondary small mb-0">
                      Your enquiry can be reviewed by the REYASA
                      admin team.
                    </p>
                  </div>
                </div>

                <hr className="my-3" />

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
          <div className="col-12 col-md-7 col-lg-6">
            <div className="card border-0 shadow rounded-3">
              <div className="card-body p-3 p-md-4">

                <div className="mb-3">
                  <p className="text-uppercase text-secondary small fw-semibold mb-2">
                    We'd love to hear from you
                  </p>

                  <h2 className="h4 fw-bold mb-2">
                    Send an Enquiry
                  </h2>

                  <p className="text-secondary small mb-0">
                    Complete the form below and share your question
                    with us.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>

                  {/* PRODUCT / COLLECTION */}
                  <div className="mb-3">
                    <label
                      htmlFor="productName"
                      className="form-label fw-semibold small mb-1"
                    >
                      Product / Collection
                      <span className="text-secondary fw-normal">
                        {" "}(Optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      className="form-control"
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
                      className="form-label fw-semibold small mb-1"
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
                        className="form-label fw-semibold small mb-1"
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
                        className="form-label fw-semibold small mb-1"
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
                  <div className="mb-3">
                    <label
                      htmlFor="message"
                      className="form-label fw-semibold small mb-1"
                    >
                      Your Message *
                    </label>

                    <textarea
                      className="form-control"
                      id="message"
                      name="message"
                      rows="4"
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

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    className="btn btn-dark w-100"
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
        <div className="text-center mt-4">
          <p className="fw-semibold mb-1" style={{ color: MAROON }}>
            Made for your style. Made for you.
          </p>

          <p className="small mb-0" style={{ color: MAROON }}>
            REYASA — Created with passion. Worn with love.
          </p>
        </div>

      </div>
    </section>
  );
}

export default Enquiry;