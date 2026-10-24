
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FooterService from "../services/FooterService";

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
    { label: "Twitter", url: "https://twitter.com" },
  ],
  policyLinks: [
    { label: "Privacy Policy", url: "/privacy-policy" },
    { label: "Terms & Conditions", url: "/terms-and-conditions" },
    { label: "Shipping Policy", url: "/shipping-policy" },
    { label: "Return Policy", url: "/return-policy" },
  ],
  copyright: "© 2026 REYASA. All Rights Reserved.",
};

function Footer() {
  const [footer, setFooter] = useState(DEFAULT_FOOTER);

  useEffect(() => {
    let active = true;

    const loadFooter = async () => {
      try {
        const response = await FooterService.getFooter();

        if (!active) return;

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
      } catch (error) {
        console.error(
          "Unable to load REYASA footer settings:",
          error
        );
        // Keep the default footer if the backend is unavailable.
      }
    };

    loadFooter();

    return () => {
      active = false;
    };
  }, []);

  const renderLink = (item, index) => {
    if (!item?.label?.trim() || !item?.url?.trim()) {
      return null;
    }

    const isExternal = /^https?:\/\//i.test(item.url);

    return (
      <li key={`${item.label}-${item.url}-${index}`}>
        {isExternal ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white-50 text-decoration-none"
          >
            {item.label}
          </a>
        ) : (
          <Link
            to={item.url}
            className="text-white-50 text-decoration-none"
          >
            {item.label}
          </Link>
        )}
      </li>
    );
  };

  return (
    <footer
      className="text-white border-top border-light border-opacity-10 py-5"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div className="container">
        <div className="row gy-4">

          {/* BRAND INFORMATION */}
          <div className="col-12 col-md-6 col-lg-3">
            <h4 className="text-white fw-bold mb-2">
              {footer.brandName}
            </h4>

            {footer.tagline && (
              <p className="text-white-50 small mb-2">
                {footer.tagline}
              </p>
            )}

            {footer.description && (
              <p className="text-white-50 small mb-0">
                {footer.description}
              </p>
            )}
          </div>

          {/* QUICK LINKS */}
          <div className="col-12 col-md-6 col-lg-3">
            <h5 className="text-white fw-bold mb-3">
              Quick Links
            </h5>

            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              {footer.quickLinks.map(renderLink)}
            </ul>
          </div>

          {/* CONTACT INFORMATION */}
          <div className="col-12 col-md-6 col-lg-3">
            <h5 className="text-white fw-bold mb-3">
              Contact Us
            </h5>

            <ul className="list-unstyled text-white-50 small d-flex flex-column gap-2 mb-0">
              {footer.phone && (
                <li>
                  <i className="bi bi-telephone me-2"></i>
                  <a
                    href={`tel:${footer.phone.replace(/[^\d+]/g, "")}`}
                    className="text-white-50 text-decoration-none"
                  >
                    {footer.phone}
                  </a>
                </li>
              )}

              {footer.email && (
                <li className="text-break">
                  <i className="bi bi-envelope me-2"></i>
                  <a
                    href={`mailto:${footer.email}`}
                    className="text-white-50 text-decoration-none"
                  >
                    {footer.email}
                  </a>
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

          {/* SOCIAL LINKS AND POLICIES */}
          <div className="col-12 col-md-6 col-lg-3">
            <h5 className="text-white fw-bold mb-3">
              Follow Us
            </h5>

            <ul className="list-unstyled text-white-50 small d-flex flex-column gap-2 mb-4">
              {footer.socialLinks.map(renderLink)}
            </ul>

            {footer.policyLinks.length > 0 && (
              <>
                <h6 className="text-white fw-bold mb-3">
                  Customer Information
                </h6>

                <ul className="list-unstyled text-white-50 small d-flex flex-column gap-2 mb-0">
                  {footer.policyLinks.map(renderLink)}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="row mt-5 pt-4 border-top border-light border-opacity-10">
          <div className="col-12 text-center text-white-50 small">
            {footer.copyright}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
