
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AboutServices from "../services/AboutServices";
import heroBackground from "../assets/reyasa-background.png";

const MAROON = "#800000";

const defaultAbout = {
  title: "About REYASA",
  paragraph1:
    "REYASA is not just a clothing brand. It is a creation born from the passion, creativity and hard work of its owners.",
  paragraph2:
    "Every design begins with an idea, and every piece is created with care, patience and attention to detail.",
  paragraph3:
    "We put our heart into what we create because we believe that clothing should carry more than style — it should carry a story.",
  paragraph4:
    "When you choose REYASA, you are not simply buying a shirt. You are becoming a part of the story we are creating.",
  tagline: "Created with passion. Worn with love.",
  signature: "— The Creators of REYASA",
};

function ManageAbout() {
  const [about, setAbout] = useState(defaultAbout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAboutUs = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await AboutServices.getAboutUs();

      const data = response?.data ?? response;

      setAbout({
        ...defaultAbout,
        ...(data || {}),
      });
    } catch (err) {
      console.error("Error loading About Us:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load About Us content. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAboutUs();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAbout((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const aboutData = {
        title: about.title,
        paragraph1: about.paragraph1,
        paragraph2: about.paragraph2,
        paragraph3: about.paragraph3,
        paragraph4: about.paragraph4,
        tagline: about.tagline,
        signature: about.signature,
      };

      const response = await AboutServices.updateAboutUs(aboutData);
      const data = response?.data ?? response;

      setAbout((previous) => ({
        ...previous,
        ...(data || {}),
      }));

      setMessage("About Us content updated successfully!");
    } catch (err) {
      console.error("Error updating About Us:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Only an admin can update About Us.");
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to update About Us. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const renderTextarea = (label, name, rows = 4) => (
    <div className="mb-4" key={name}>
      <label htmlFor={name} className="form-label fw-semibold">
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        className="form-control"
        rows={rows}
        value={about[name] || ""}
        onChange={handleChange}
        maxLength={3000}
        required
      />
    </div>
  );

  return (
    <main
      className="container-fluid px-3 px-md-4 pb-4 pb-md-5"
      style={{
        backgroundColor: "#f5eee7",
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll",
        paddingTop: "150px",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div className="container">
        {/* PAGE HEADING */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <p
              className="text-uppercase fw-bold mb-2"
              style={{
                color: MAROON,
                letterSpacing: "3px",
                fontSize: "12px",
              }}
            >
              REYASA Administration
            </p>

            <h2
              className="fw-bold mb-2"
              style={{
                color: MAROON,
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              }}
            >
              <i className="bi bi-info-circle me-2"></i>
              Manage About Us
            </h2>

            <p className="mb-0" style={{ color: MAROON }}>
              Update the story and identity displayed on REYASA.
            </p>
          </div>

          <Link
            to="/about"
            className="btn btn-dark px-4"
          >
            <i className="bi bi-eye me-2"></i>
            Preview Page
          </Link>
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="alert alert-success" role="status">
            <i className="bi bi-check-circle me-2"></i>
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* ABOUT US FORM */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-3 p-md-4 p-lg-5">
            {loading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border"
                  style={{ color: MAROON }}
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>

                <p className="mt-3 mb-0">
                  Loading About Us content...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <h5 className="fw-bold mb-1" style={{ color: MAROON }}>
                    About Us Content
                  </h5>

                  <p className="text-secondary small mb-0">
                    Edit the brand story, tagline, and closing signature.
                  </p>
                </div>

                {/* PAGE HEADING */}
                <div className="mb-4">
                  <label htmlFor="title" className="form-label fw-semibold">
                    Page Heading
                  </label>

                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-control"
                    value={about.title || ""}
                    onChange={handleChange}
                    maxLength={150}
                    required
                  />
                </div>

                {/* PARAGRAPHS */}
                {renderTextarea("Paragraph 1", "paragraph1")}
                {renderTextarea("Paragraph 2", "paragraph2")}
                {renderTextarea("Paragraph 3", "paragraph3")}
                {renderTextarea("Paragraph 4", "paragraph4")}

                {/* TAGLINE */}
                <div className="mb-4">
                  <label htmlFor="tagline" className="form-label fw-semibold">
                    Brand Tagline
                  </label>

                  <input
                    type="text"
                    id="tagline"
                    name="tagline"
                    className="form-control"
                    value={about.tagline || ""}
                    onChange={handleChange}
                    maxLength={255}
                    required
                  />
                </div>

                {/* SIGNATURE */}
                <div className="mb-4">
                  <label
                    htmlFor="signature"
                    className="form-label fw-semibold"
                  >
                    Signature
                  </label>

                  <input
                    type="text"
                    id="signature"
                    name="signature"
                    className="form-control"
                    value={about.signature || ""}
                    onChange={handleChange}
                    maxLength={255}
                    required
                  />
                </div>

                {/* FORM ACTIONS */}
                <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 border-top pt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={loadAboutUs}
                    disabled={saving || loading}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Reload Content
                  </button>

                  <button
                    type="submit"
                    className="btn btn-dark px-4"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* FOOTER BRAND MESSAGE */}
        <div className="text-center py-4">
          <small
            className="fw-semibold"
            style={{
              color: MAROON,
              letterSpacing: "2px",
            }}
          >
            REYASA · CREATED WITH PASSION. WORN WITH LOVE.
          </small>
        </div>
      </div>
    </main>
  );
}

export default ManageAbout;
