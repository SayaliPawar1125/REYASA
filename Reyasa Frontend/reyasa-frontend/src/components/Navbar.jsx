import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import logo from "../assets/logo.jpeg";

import CartServices from "../services/CartServices";
import WishlistService from "../services/WishlistService";

import "./navbar.css";

function Navbar() {

  const [menuOpen, setMenuOpen] = useState(false);

  const [cartCount, setCartCount] = useState(0);

  const [wishlistCount, setWishlistCount] = useState(0);

  // Login status
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

  const location = useLocation();

  // Close mobile menu
  const closeMenu = () => {
    setMenuOpen(false);
  };

  // ==========================================
  // CHECK LOGIN STATUS
  // ==========================================

  useEffect(() => {

    const checkLoginStatus = () => {

      const token = localStorage.getItem("token");

      setIsLoggedIn(Boolean(token));

    };

    checkLoginStatus();

    window.addEventListener("authChanged", checkLoginStatus);

    window.addEventListener("storage", checkLoginStatus);

    return () => {

      window.removeEventListener("authChanged", checkLoginStatus);

      window.removeEventListener("storage", checkLoginStatus);

    };

  }, [location.pathname]);


  // ==========================================
  // LOAD CART COUNT
  // ==========================================

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


  // Refresh cart count
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


  // ==========================================
  // LOAD WISHLIST COUNT FROM DATABASE
  // ==========================================

  const loadWishlistCount = useCallback(async () => {

    const token = localStorage.getItem("token");

    // If user is not logged in
    if (!token) {

      setWishlistCount(0);

      return;

    }

    try {

      // Fetch wishlist count from Spring Boot API
      const response = await WishlistService.getWishlistCount();

      setWishlistCount(Number(response.data) || 0);

    } catch (error) {

      console.error(
        "Unable to load wishlist count:",
        error.response?.data || error.message || error
      );

      setWishlistCount(0);

    }

  }, []);


  // Refresh wishlist count when:
  // 1. User navigates
  // 2. Product is added to wishlist
  // 3. Product is removed from wishlist
  // 4. Authentication changes

  useEffect(() => {

    loadWishlistCount();

    const handleWishlistUpdated = () => {
      loadWishlistCount();
    };

    const handleAuthChanged = () => {

      const token = localStorage.getItem("token");

      if (token) {

        loadWishlistCount();

      } else {

        setWishlistCount(0);

      }

    };

    window.addEventListener(
      "wishlistUpdated",
      handleWishlistUpdated
    );

    window.addEventListener(
      "authChanged",
      handleAuthChanged
    );

    return () => {

      window.removeEventListener(
        "wishlistUpdated",
        handleWishlistUpdated
      );

      window.removeEventListener(
        "authChanged",
        handleAuthChanged
      );

    };

  }, [loadWishlistCount, location.pathname]);


  // ==========================================
  // CLOSE MOBILE MENU WHEN NAVIGATING
  // ==========================================

  useEffect(() => {

    setMenuOpen(false);

  }, [location.pathname]);


  // ==========================================
  // NAVBAR UI
  // ==========================================

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


            {/* CART, WISHLIST AND ACCOUNT */}

            <div className="reyasa-nav-actions">


              {/* WISHLIST LINK */}

              <Link
                to="/wishlist"
                className="reyasa-cart-link"
                onClick={closeMenu}
                aria-label={`Wishlist, ${wishlistCount} products`}
                title="My Wishlist"
              >

                <span className="reyasa-cart-icon">

                  <i
                    className="bi bi-heart"
                    aria-hidden="true"
                  />

                  {wishlistCount > 0 && (

                    <span className="reyasa-cart-badge">

                      {wishlistCount > 99
                        ? "99+"
                        : wishlistCount}

                    </span>

                  )}

                </span>

                <span>Wishlist</span>

              </Link>


              {/* CART LINK */}

              <Link
                to="/cart"
                className="reyasa-cart-link"
                onClick={closeMenu}
                aria-label={`Shopping cart, ${cartCount} items`}
              >

                <span className="reyasa-cart-icon">

                  <i
                    className="bi bi-cart3"
                    aria-hidden="true"
                  />

                  {cartCount > 0 && (

                    <span className="reyasa-cart-badge">

                      {cartCount > 99
                        ? "99+"
                        : cartCount}

                    </span>

                  )}

                </span>

                <span>Cart</span>

              </Link>


              {/* LOGIN / PROFILE */}

              <Link
                to={isLoggedIn ? "/profile" : "/login"}
                className="reyasa-account-link"
                title={
                  isLoggedIn
                    ? "My Profile"
                    : "Customer / Admin Login"
                }
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

                  {isLoggedIn
                    ? "My Profile"
                    : "Login"}

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