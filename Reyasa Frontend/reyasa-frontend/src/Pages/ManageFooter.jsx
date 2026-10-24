
import React, { useEffect, useState } from "react";
import heroBackground from "../assets/reyasa-background.png";
import FooterService from "../services/FooterService";

const MAROON = "#800000";

const DEFAULT_FOOTER = {
  brandName: "REYASA",
  tagline: "Created with passion. Worn with love.",
  description:
    "Discover thoughtfully designed shirts that combine timeless style with everyday comfort.",
  quickLinks: [
    { label: "Home", url: "/" },
    { label: "Collection", url: "/collection" },
    { label: "About Us", url: "/about" },
    { label: "Contact", url: "/contact" },
  ],
  phone: "+91 98765 43210",
  email: "reyasa@gmail.com",
  address: "Mumbai, Maharashtra, India",
  socialLinks: [
    { label: "Instagram", url: "https://instagram.com" },
    { label: "Facebook", url: "https://facebook.com" },
    { label: "YouTube", url: "https://youtube.com" },
  ],
  policyLinks: [
    { label: "Privacy Policy", url: "/privacy-policy" },
    { label: "Terms & Conditions", url: "/terms-and-conditions" },
    { label: "Shipping Policy", url: "/shipping-policy" },
    { label: "Return Policy", url: "/return-policy" },
  ],
  copyright: "© 2026 REYASA. All Rights Reserved.",
};

function ManageFooter() {
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [preview, setPreview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // LOAD FOOTER SETTINGS FROM SPRING BOOT
  useEffect(() => {
    loadFooter();
  }, []);

  const loadFooter = async () => {
    setLoading(true);

    try {
      const response = await FooterService.getFooter();
      const data = response.data;

      setFooter({
        ...DEFAULT_FOOTER,
        ...data,
        quickLinks: Array.isArray(data.quickLinks)
          ? data.quickLinks
          : DEFAULT_FOOTER.quickLinks,
        socialLinks: Array.isArray(data.socialLinks)
          ? data.socialLinks
          : DEFAULT_FOOTER.socialLinks,
        policyLinks: Array.isArray(data.policyLinks)
          ? data.policyLinks
          : DEFAULT_FOOTER.policyLinks,
      });

      setMessage("");
    } catch (error) {
      console.error("Unable to load footer settings:", error);
      setMessageType("danger");
      setMessage(
        "Unable to load footer settings from the server. Check whether your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // UPDATE TEXT FIELDS
  const updateField = (field, value) => {
    setFooter((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
  };

  // UPDATE A LINK
  const updateLink = (section, index, field, value) => {
    setFooter((previous) => ({
      ...previous,
      [section]: previous[section].map((link, linkIndex) =>
        linkIndex === index
          ? { ...link, [field]: value }
          : link
      ),
    }));

    setMessage("");
  };

  // ADD A LINK
  const addLink = (section) => {
    setFooter((previous) => ({
      ...previous,
      [section]: [
        ...previous[section],
        { label: "", url: "" },
      ],
    }));

    setMessage("");
  };

  // REMOVE A LINK
  const removeLink = (section, index) => {
    setFooter((previous) => ({
      ...previous,
      [section]: previous[section].filter(
        (_, linkIndex) => linkIndex !== index
      ),
    }));

    setMessage("");
  };

  // SAVE FOOTER SETTINGS TO MYSQL THROUGH SPRING BOOT
  const saveFooter = async (event) => {
    event.preventDefault();

    if (!footer.brandName.trim()) {
      setMessageType("danger");
      setMessage("Brand name is required.");
      return;
    }

    if (!footer.email.trim()) {
      setMessageType("danger");
      setMessage("Email address is required.");
      return;
    }

    const sections = [
      ["Quick Links", footer.quickLinks],
      ["Social Media Links", footer.socialLinks],
      ["Policy Links", footer.policyLinks],
    ];

    for (const [sectionName, links] of sections) {
      for (const link of links) {
        if (!link.label.trim() || !link.url.trim()) {
          setMessageType("danger");
          setMessage(
            `${sectionName}: enter both a label and destination URL for every link, or remove the empty link.`
          );
          return;
        }
      }
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await FooterService.saveFooter(footer);

      setFooter({
        ...DEFAULT_FOOTER,
        ...response.data,
        quickLinks: response.data.quickLinks || [],
        socialLinks: response.data.socialLinks || [],
        policyLinks: response.data.policyLinks || [],
      });

      setMessageType("success");
      setMessage("Footer settings saved successfully to the database.");
    } catch (error) {
      console.error("Unable to save footer settings:", error);

      setMessageType("danger");
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save footer settings. Check your backend, JWT token, and admin permissions."
      );
    } finally {
      setSaving(false);
    }
  };

  // RESET FOOTER SETTINGS THROUGH SPRING BOOT
  const resetFooter = async () => {
    const confirmed = window.confirm(
      "Reset all footer fields to the default REYASA content?"
    );

    if (!confirmed) {
      return;
    }

    setResetting(true);
    setMessage("");

    try {
      const response = await FooterService.resetFooter();

      setFooter({
        ...DEFAULT_FOOTER,
        ...response.data,
        quickLinks: response.data.quickLinks || [],
        socialLinks: response.data.socialLinks || [],
        policyLinks: response.data.policyLinks || [],
      });

      setMessageType("success");
      setMessage("Default footer settings restored in the database.");
    } catch (error) {
      console.error("Unable to reset footer settings:", error);

      setMessageType("danger");
      setMessage(
        error.response?.data?.message ||
          "Unable to reset footer settings. Check your backend and admin permissions."
      );
    } finally {
      setResetting(false);
    }
  };

  // REUSABLE LINK EDITOR
  const renderLinkEditor = (title, section) => (
    <div className="mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h6 className="fw-bold mb-0">{title}</h6>

        <button
          type="button"
          className="btn btn-sm btn-outline-dark"
          onClick={() => addLink(section)}
          disabled={loading || saving || resetting}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Add Link
        </button>
      </div>

      {footer[section].length === 0 && (
        <p className="text-secondary small">
          No links added yet.
        </p>
      )}

      {footer[section].map((link, index) => (
        <div
          className="row g-2 align-items-end mb-3"
          key={`${section}-${index}`}
        >
          <div className="col-12 col-md-5">
            <label
              className="form-label small fw-semibold"
              htmlFor={`${section}-label-${index}`}
            >
              Link Label
            </label>

            <input
              id={`${section}-label-${index}`}
              type="text"
              className="form-control"
              value={link.label}
              onChange={(event) =>
                updateLink(
                  section,
                  index,
                  "label",
                  event.target.value
                )
              }
              placeholder="Enter link label"
              disabled={loading || saving || resetting}
            />
          </div>

          <div className="col-12 col-md-5">
            <label
              className="form-label small fw-semibold"
              htmlFor={`${section}-url-${index}`}
            >
              Destination URL
            </label>

            <input
              id={`${section}-url-${index}`}
              type="text"
              className="form-control"
              value={link.url}
              onChange={(event) =>
                updateLink(
                  section,
                  index,
                  "url",
                  event.target.value
                )
              }
              placeholder="/page or https://example.com"
              disabled={loading || saving || resetting}
            />
          </div>

          <div className="col-12 col-md-2">
            <button
              type="button"
              className="btn btn-outline-danger w-100"
              onClick={() => removeLink(section, index)}
              disabled={loading || saving || resetting}
              aria-label={`Remove ${link.label || "link"}`}
            >
              <i className="bi bi-trash me-1"></i>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const previewLinks = (links = []) =>
    links.filter(
      (link) =>
        link.label?.trim() && link.url?.trim()
    );

  return (
    <main
      className="container-fluid px-3 px-md-4 pb-5"
      style={{
        paddingTop: "150px",
        minHeight: "100vh",
        backgroundColor: "#f5eee7",
        backgroundImage: `url("${heroBackground}")`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll",
        boxSizing: "border-box",
      }}
    >
      {/* PAGE HEADING */}
      <div className="mb-4">
        <p
          className="text-uppercase fw-semibold mb-2"
          style={{
            color: MAROON,
            letterSpacing: "3px",
            fontSize: "0.8rem",
          }}
        >
          REYASA Administration
        </p>

        <h2 className="fw-bold mb-2" style={{ color: MAROON }}>
          <i className="bi bi-layout-text-window-reverse me-2"></i>
          Manage Footer
        </h2>

        <p className="mb-0" style={{ color: MAROON }}>
          Manage your storefront footer content, navigation links,
          contact information, policies, and social media links.
        </p>
      </div>

      {/* STATUS MESSAGE */}
      {message && (
        <div
          className={`alert alert-${messageType} alert-dismissible fade show`}
          role="alert"
        >
          {message}

          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setMessage("")}
          ></button>
        </div>
      )}

      {loading && (
        <div className="alert alert-info" role="status">
          <span
            className="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          Loading footer settings...
        </div>
      )}

      {/* FOOTER SETTINGS FORM */}
      <form onSubmit={saveFooter}>
        {/* GENERAL INFORMATION */}
        <section className="bg-white bg-opacity-95 p-3 p-md-4 mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 pb-3 border-bottom">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: MAROON }}>
                Footer Information
              </h5>

              <p className="text-secondary small mb-0">
                Update the main brand details displayed in your footer.
              </p>
            </div>

            <span className="badge text-bg-secondary">
              General Settings
            </span>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="brandName" className="form-label fw-semibold">
                Brand Name
              </label>

              <input
                id="brandName"
                type="text"
                className="form-control"
                value={footer.brandName}
                onChange={(event) =>
                  updateField("brandName", event.target.value)
                }
                required
                disabled={loading || saving || resetting}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="tagline" className="form-label fw-semibold">
                Brand Tagline
              </label>

              <input
                id="tagline"
                type="text"
                className="form-control"
                value={footer.tagline}
                onChange={(event) =>
                  updateField("tagline", event.target.value)
                }
                disabled={loading || saving || resetting}
              />
            </div>

            <div className="col-12">
              <label htmlFor="description" className="form-label fw-semibold">
                Brand Description
              </label>

              <textarea
                id="description"
                className="form-control"
                rows="3"
                value={footer.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Describe your brand..."
                disabled={loading || saving || resetting}
              />
            </div>
          </div>
        </section>

        {/* CONTACT INFORMATION */}
        <section className="bg-white bg-opacity-95 p-3 p-md-4 mb-4">
          <h5
            className="fw-bold mb-4 pb-3 border-bottom"
            style={{ color: MAROON }}
          >
            Contact Information
          </h5>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="footerPhone" className="form-label fw-semibold">
                Phone Number
              </label>

              <input
                id="footerPhone"
                type="tel"
                className="form-control"
                value={footer.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                disabled={loading || saving || resetting}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="footerEmail" className="form-label fw-semibold">
                Email Address
              </label>

              <input
                id="footerEmail"
                type="email"
                className="form-control"
                value={footer.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                required
                disabled={loading || saving || resetting}
              />
            </div>

            <div className="col-12">
              <label htmlFor="footerAddress" className="form-label fw-semibold">
                Business Location
              </label>

              <input
                id="footerAddress"
                type="text"
                className="form-control"
                value={footer.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                disabled={loading || saving || resetting}
              />
            </div>
          </div>
        </section>

        {/* NAVIGATION, SOCIAL AND POLICY LINKS */}
        <section className="bg-white bg-opacity-95 p-3 p-md-4 mb-4">
          <h5
            className="fw-bold mb-4 pb-3 border-bottom"
            style={{ color: MAROON }}
          >
            Footer Navigation
          </h5>

          {renderLinkEditor("Quick Links", "quickLinks")}

          <hr className="my-4" />

          {renderLinkEditor("Social Media Links", "socialLinks")}

          <hr className="my-4" />

          {renderLinkEditor("Policies and Legal Links", "policyLinks")}
        </section>

        {/* COPYRIGHT */}
        <section className="bg-white bg-opacity-95 p-3 p-md-4 mb-4">
          <h5 className="fw-bold mb-3" style={{ color: MAROON }}>
            Copyright
          </h5>

          <label htmlFor="copyright" className="form-label fw-semibold">
            Copyright Text
          </label>

          <input
            id="copyright"
            type="text"
            className="form-control"
            value={footer.copyright}
            onChange={(event) =>
              updateField("copyright", event.target.value)
            }
            disabled={loading || saving || resetting}
          />
        </section>

        {/* ACTION BUTTONS */}
        <div className="d-flex flex-wrap gap-2 justify-content-between mb-4">
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={() => setPreview((previous) => !previous)}
          >
            <i className="bi bi-eye me-2"></i>
            {preview ? "Hide Preview" : "Show Preview"}
          </button>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={resetFooter}
              disabled={loading || saving || resetting}
            >
              {resetting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Resetting...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  Reset Defaults
                </>
              )}
            </button>

            <button
              type="submit"
              className="btn text-white"
              style={{ backgroundColor: MAROON }}
              disabled={loading || saving || resetting}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2"></i>
                  Save Footer Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* LIVE FOOTER PREVIEW */}
      {preview && (
        <section className="mb-4">
          <div className="mb-3">
            <h5 className="fw-bold" style={{ color: MAROON }}>
              Footer Preview
            </h5>

            <p className="text-secondary small mb-0">
              Preview the footer arrangement. Save your changes to publish them.
            </p>
          </div>

          <footer
            className="text-white border-top border-light border-opacity-10 py-5"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
          >
            <div className="container-fluid">
              <div className="row gy-4">
                {/* BRAND */}
                <div className="col-12 col-md-6 col-lg-3">
                  <h4 className="fw-bold text-white">
                    {footer.brandName || "REYASA"}
                  </h4>

                  <p className="small text-white-50">
                    {footer.tagline}
                  </p>

                  <p className="small text-white-50">
                    {footer.description}
                  </p>
                </div>

                {/* QUICK LINKS */}
                <div className="col-12 col-md-6 col-lg-3">
                  <h6 className="fw-bold mb-3">Quick Links</h6>

                  <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                    {previewLinks(footer.quickLinks).map((link, index) => (
                      <li key={`preview-quick-${index}`}>
                        <span className="text-white-50">
                          {link.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CONTACT */}
                <div className="col-12 col-md-6 col-lg-3">
                  <h6 className="fw-bold mb-3">Contact Us</h6>

                  <ul className="list-unstyled small text-white-50 d-flex flex-column gap-2 mb-0">
                    {footer.phone && (
                      <li>
                        <i className="bi bi-telephone me-2"></i>
                        {footer.phone}
                      </li>
                    )}

                    {footer.email && (
                      <li className="text-break">
                        <i className="bi bi-envelope me-2"></i>
                        {footer.email}
                      </li>
                    )}

                    {footer.address && (
                      <li>
                        <i className="bi bi-geo-alt me-2"></i>
                        {footer.address}
                      </li>
                    )}
                  </ul>
                </div>

                {/* SOCIAL AND POLICY LINKS */}
                <div className="col-12 col-md-6 col-lg-3">
                  <h6 className="fw-bold mb-3">Follow Us</h6>

                  <ul className="list-unstyled small d-flex flex-column gap-2 mb-3">
                    {previewLinks(footer.socialLinks).map((link, index) => (
                      <li key={`preview-social-${index}`}>
                        <span className="text-white-50">
                          {link.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <h6 className="fw-bold mb-2">Policies</h6>

                  <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                    {previewLinks(footer.policyLinks).map((link, index) => (
                      <li key={`preview-policy-${index}`}>
                        <span className="text-white-50">
                          {link.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-top border-light border-opacity-10 mt-5 pt-4 text-center">
                <p className="text-white-50 small mb-0">
                  {footer.copyright}
                </p>
              </div>
            </div>
          </footer>
        </section>
      )}
    </main>
  );
}

export default ManageFooter;
