
import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpeg";
import CartServices from "../services/CartServices";
import "./navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Update the navbar immediately when authentication changes
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

  const location = useLocation();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Check login status whenever the user navigates
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    };

    checkLoginStatus();

    window.addEventListener("authChanged", checkLoginStatus);
    window.addEventListener("storage", checkLoginStatus);

    return () => {
      window.removeEventListener("authChanged", checkLoginStatus);
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, [location.pathname]);

  // Load cart items and calculate total quantity
  const loadCartCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (
      !token ||
      !userId ||
      userId === "undefined" ||
      userId === "null" ||
      !Number.isInteger(Number(userId)) ||
      Number(userId) <= 0
    ) {
      setCartCount(0);
      return;
    }

    try {
      const response = await CartServices.getCartItems(userId);
      const items = response.data?.items;

      if (!Array.isArray(items)) {
        console.error("Unexpected cart API response:", response.data);
        setCartCount(0);
        return;
      }

      const totalQuantity = items.reduce(
        (total, item) =>
          total + Math.max(0, Number(item.quantity) || 0),
        0
      );

      setCartCount(totalQuantity);
    } catch (error) {
      console.error(
        "Unable to load cart count:",
        error.response?.data || error.message || error
      );

      setCartCount(0);
    }
  }, []);

  // Refresh cart when navigating or when the cart/authentication changes
  useEffect(() => {
    loadCartCount();

    const handleCartUpdated = () => {
      loadCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, [loadCartCount, location.pathname]);

  // Close the mobile menu when navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="reyasa-header">
      <nav className="reyasa-navbar">
        <div className="reyasa-nav-container">

          {/* REYASA BRAND */}
          <Link
            to="/"
            className="reyasa-brand"
            onClick={closeMenu}
          >
            <img
              src={logo}
              alt="REYASA Logo"
              className="reyasa-logo"
            />

            <div className="reyasa-brand-copy">
              <div className="reyasa-brand-name">
                REYASA
              </div>

              <div className="reyasa-brand-tagline">
                SUSTAINABLE CLOTHING
              </div>
            </div>
          </Link>

          {/* MOBILE MENU BUTTON */}
          <button
            className="reyasa-menu-toggle"
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-controls="reyasaNavbar"
            aria-expanded={menuOpen}
            aria-label={
              menuOpen ? "Close navigation" : "Open navigation"
            }
          >
            <i
              className={menuOpen ? "bi bi-x-lg" : "bi bi-list"}
              aria-hidden="true"
            />
          </button>

          {/* NAVIGATION */}
          <div
            id="reyasaNavbar"
            className={`reyasa-nav-content ${
              menuOpen ? "open" : ""
            }`}
          >
            <div className="reyasa-nav-links">
              <Link
                to="/"
                className="reyasa-nav-link"
                onClick={closeMenu}
              >
                Home
              </Link>

              <Link
                to="/collection"
                className="reyasa-nav-link"
                onClick={closeMenu}
              >
                Collection
              </Link>

              <Link
                to="/about"
                className="reyasa-nav-link"
                onClick={closeMenu}
              >
                About us 
              </Link>

              <Link
                to="/enquiry"
                className="reyasa-nav-link"
                onClick={closeMenu}
              >
                Enquiry
              </Link>
            </div>

            {/* CART AND ACCOUNT */}
            <div className="reyasa-nav-actions">

              {/* CART LINK */}
              <Link
                to="/cart"
                className="reyasa-cart-link"
                onClick={closeMenu}
                aria-label={`Shopping cart, ${cartCount} items`}
              >
                <span className="reyasa-cart-icon">
                  <i className="bi bi-cart3" aria-hidden="true" />

                  {cartCount > 0 && (
                    <span className="reyasa-cart-badge">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </span>

                <span>Cart</span>
              </Link>

              {/* LOGIN / PROFILE */}
              <Link
                to={isLoggedIn ? "/profile" : "/login"}
                className="reyasa-account-link"
                title={isLoggedIn ? "My Profile" : "Customer / Admin Login"}
                onClick={closeMenu}
              >
                <i
                  className={
                    isLoggedIn
                      ? "bi bi-person-circle"
                      : "bi bi-person"
                  }
                  aria-hidden="true"
                />

                <span>
                  {isLoggedIn ? "My Profile" : "Login"}
                </span>
              </Link>

            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
