import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import ManageProductServices from "../services/ManageProductServices";
import CartServices from "../services/CartServices";
import WishlistService from "../services/WishlistService";

import reyasaBackground from "../assets/reyasa-background.png";

function Collection() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSizes, setSelectedSizes] = useState({});

  const [cartLoading, setCartLoading] = useState(null);

  // SUCCESS NOTIFICATION
  const [cartMessage, setCartMessage] = useState("");
  const [showCartToast, setShowCartToast] = useState(false);

  // WISHLIST
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(null);

  // GET AVAILABLE SIZES
  const getAvailableSizes = (availableSizes) => {
    if (Array.isArray(availableSizes)) {
      return availableSizes.map((size) => String(size).trim()).filter(Boolean);
    }

    if (typeof availableSizes === "string") {
      return availableSizes.split(",").map((size) => size.trim()).filter(Boolean);
    }

    return [];
  };

  // GET PRODUCT IMAGE URL
  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";

    if (/^https?:\/\//i.test(imageKey)) return imageKey;

    if (imageKey.startsWith("/")) {
      return `http://localhost:8080${imageKey}`;
    }

    return `http://localhost:8080/uploads/${encodeURIComponent(imageKey)}`;
  };

  // LOGIN POPUP
  const showLoginPopup = async () => {
    const result = await Swal.fire({
      title: "Please Login to REYASA",
      html: `
        <div class="reyasa-login-content">
          <div class="reyasa-login-icon">
            <i class="bi bi-bag-heart-fill"></i>
          </div>
          <p class="reyasa-login-tagline">
            Your style journey starts here!
          </p>
          <p class="reyasa-login-description">
            Please log in to your REYASA account to add
            your favourite products to the cart.
          </p>
        </div>
      `,
      showCancelButton: false,
      confirmButtonText:
        '<i class="bi bi-box-arrow-in-right me-2"></i>Login Now',
      confirmButtonColor: "#800000",
      customClass: {
        popup: "reyasa-popup",
        title: "reyasa-popup-title",
        htmlContainer: "reyasa-popup-message",
        confirmButton: "reyasa-popup-button",
      },
    });

    if (result.isConfirmed) {
      navigate("/login");
    }
  };

  // SHOW SUCCESS NOTIFICATION
  const showSuccessNotification = (message) => {
    setCartMessage(message);
    setShowCartToast(false);

    // Allow notification to restart when clicked repeatedly
    setTimeout(() => {
      setShowCartToast(true);
    }, 50);
  };

  // HIDE NOTIFICATION AFTER 3 SECONDS
  useEffect(() => {
    if (!showCartToast) return;

    const timer = setTimeout(() => {
      setShowCartToast(false);
      setCartMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [showCartToast]);

  // LOAD PRODUCTS
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await ManageProductServices.getAllActiveProducts();

      const backendProducts = Array.isArray(response.data)
        ? response.data.filter((product) => product.active !== false)
        : [];

      setProducts(backendProducts);
      setSelectedSizes({});
    } catch (err) {
      console.error("Collection products error:", err);

      setError(
        err.response?.status === 401 || err.response?.status === 403
          ? "Unable to access products. Please check your backend security configuration."
          : "Unable to load the collection. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // LOAD WISHLIST FROM DATABASE
  const loadWishlist = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setWishlist([]);
      return;
    }

    try {
      const response = await WishlistService.getWishlist();

      const wishlistProducts = Array.isArray(response.data)
        ? response.data.map((item) => String(item.productId))
        : [];

      setWishlist(wishlistProducts);
    } catch (error) {
      console.error("Unable to load wishlist:", error);
      setWishlist([]);
    }
  }, []);

  // LOAD DATA ON PAGE OPEN
  useEffect(() => {
    loadProducts();
    loadWishlist();
  }, [loadWishlist]);

  // REFRESH WISHLIST AFTER LOGIN CHANGE
  useEffect(() => {
    const handleAuthChanged = () => {
      loadWishlist();
    };

    window.addEventListener("authChanged", handleAuthChanged);

    return () => {
      window.removeEventListener("authChanged", handleAuthChanged);
    };
  }, [loadWishlist]);

  // CATEGORY FILTERS
  const categories = [
    "All",
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ];

  // FILTER PRODUCTS
  const filteredProducts = products
    .filter(
      (product) =>
        selectedCategory === "All" ||
        product.category === selectedCategory
    )
    .sort((a, b) => Number(b.id) - Number(a.id));

  // CHANGE SELECTED SIZE
  const handleSizeChange = (productId, size) => {
    setSelectedSizes((previous) => ({
      ...previous,
      [productId]: size,
    }));
  };

  // ADD OR REMOVE FROM WISHLIST
  const handleWishlist = async (product) => {
    const token = localStorage.getItem("token");

    if (!token) {
      const result = await Swal.fire({
        title: "Please Login to REYASA",
        html: `
          <div class="reyasa-login-content">
            <div class="reyasa-login-icon">
              <i class="bi bi-heart-fill"></i>
            </div>
            <p class="reyasa-login-tagline">
              Save your favourite styles!
            </p>
            <p class="reyasa-login-description">
              Please log in to your REYASA account
              to add products to your wishlist.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText:
          '<i class="bi bi-box-arrow-in-right me-2"></i>Login Now',
        cancelButtonText: "Continue Shopping",
        confirmButtonColor: "#800000",
        customClass: {
          popup: "reyasa-popup",
          title: "reyasa-popup-title",
          htmlContainer: "reyasa-popup-message",
          confirmButton: "reyasa-popup-button",
        },
      });

      if (result.isConfirmed) {
        navigate("/login");
      }

      return;
    }

    const productId = String(product.id);
    const alreadyAdded = wishlist.includes(productId);

    try {
      setWishlistLoading(product.id);

      // REMOVE FROM WISHLIST
      if (alreadyAdded) {
        await WishlistService.removeFromWishlist(product.id);

        setWishlist((previous) =>
          previous.filter((id) => String(id) !== productId)
        );

        showSuccessNotification(
          `${product.name} removed from wishlist successfully.`
        );
      }

      // ADD TO WISHLIST
      else {
        await WishlistService.addToWishlist(product.id);

        setWishlist((previous) => {
          if (previous.includes(productId)) {
            return previous;
          }

          return [...previous, productId];
        });

        showSuccessNotification(
          `${product.name} added to wishlist successfully.`
        );
      }

      // UPDATE NAVBAR WISHLIST COUNT
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (error) {
      console.error("Wishlist error:", error.response?.data || error);

      const status = error.response?.status;

      if (status === 401 || status === 403) {
        Swal.fire({
          icon: "warning",
          title: "Login Required",
          text: "Your session may have expired. Please login again.",
          confirmButtonColor: "#800000",
        }).then((result) => {
          if (result.isConfirmed) navigate("/login");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Wishlist Error",
          text:
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Unable to update your wishlist. Please try again.",
          confirmButtonColor: "#800000",
        });
      }
    } finally {
      setWishlistLoading(null);
    }
  };

  // CHECK WISHLIST STATUS
  const isInWishlist = (productId) => {
    return wishlist.includes(String(productId));
  };

  // ADD TO CART
  const handleAddToCart = async (product) => {
    setShowCartToast(false);
    setCartMessage("");

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (
      !token ||
      !userId ||
      userId === "undefined" ||
      userId === "null"
    ) {
      await showLoginPopup();
      return;
    }

    if (Number(product.stockQuantity) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Out of Stock",
        text: "This product is currently out of stock.",
        confirmButtonText: "OK",
        confirmButtonColor: "#800000",
      });
      return;
    }

    const sizes = getAvailableSizes(product.availableSizes);

    if (sizes.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Size Not Available",
        text: "No sizes are currently available for this product.",
        confirmButtonText: "OK",
        confirmButtonColor: "#800000",
      });
      return;
    }

    const size = selectedSizes[product.id];

    if (!size || !sizes.includes(size)) {
      Swal.fire({
        icon: "warning",
        title: "Please Select Size",
        text: "Please select a size before adding this product to your cart.",
        confirmButtonText: "Select Size",
        confirmButtonColor: "#800000",
        color: "#800000",
      });
      return;
    }

    try {
      setCartLoading(product.id);

      await CartServices.addToCart(product.id, userId, size, 1);

      window.dispatchEvent(new Event("cartUpdated"));

      showSuccessNotification(
        `${product.name} (${size}) added to cart successfully.`
      );
    } catch (err) {
      console.error("Add to cart error:", err.response?.data || err);

      const data = err.response?.data;

      if (err.response?.status === 401 || err.response?.status === 403) {
        Swal.fire({
          icon: "warning",
          title: "Login Required",
          text: "Your session may have expired. Please log in again.",
          confirmButtonColor: "#800000",
        }).then((result) => {
          if (result.isConfirmed) navigate("/login");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Unable to Add to Cart",
          text:
            typeof data === "string"
              ? data
              : data?.message ||
                data?.error ||
                "Unable to add this product to your cart. Please try again.",
          confirmButtonColor: "#800000",
        });
      }
    } finally {
      setCartLoading(null);
    }
  };

  return (
    <main className="min-vh-100">
      <section
        id="shirts-collection"
        className="container-fluid py-5"
        style={{
          backgroundImage: `url(${reyasaBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
          minHeight: "100vh",
        }}
      >
        <div className="container">

          {/* COLLECTION HEADING */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h2 className="fw-bold mb-1" style={{ color: "#800000" }}>
                Our Collection
              </h2>

              <p className="text-secondary mb-0">
                Explore the latest shirts from REYASA.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={loadProducts}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              {loading ? "Refreshing..." : "Refresh Products"}
            </button>
          </div>

          {/* CATEGORY FILTERS */}
          {!loading && !error && products.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-4">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`btn ${
                    selectedCategory === category
                      ? "btn-dark"
                      : "btn-outline-dark"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* TOP-RIGHT SUCCESS NOTIFICATION */}
          {showCartToast && (
            <div
              className="reyasa-cart-notification"
              role="status"
              aria-live="polite"
            >
              <i className="bi bi-check-circle-fill" aria-hidden="true"></i>

              <p className="reyasa-cart-notification-message">
                {cartMessage}
              </p>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>

              <p className="mt-3">Loading collection...</p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="alert alert-danger" role="alert">
              {error}

              <button
                type="button"
                className="btn btn-outline-danger btn-sm ms-3"
                onClick={loadProducts}
              >
                Retry
              </button>
            </div>
          )}

          {/* EMPTY COLLECTION */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="text-center py-5">
              <i
                className="bi bi-bag"
                style={{ fontSize: "42px", color: "#800000" }}
              ></i>

              <h4 className="mt-3">No products available</h4>

              <p className="text-secondary">
                {products.length === 0
                  ? "Products added by the admin will appear here."
                  : "No products were found in this category."}
              </p>
            </div>
          )}

          {/* PRODUCT CARDS */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className="row g-4">
              {filteredProducts.map((product) => {
                const sizes = getAvailableSizes(product.availableSizes);
                const outOfStock = Number(product.stockQuantity) <= 0;
                const addedToWishlist = isInWishlist(product.id);

                return (
                  <div
                    className="col-12 col-sm-6 col-lg-4 col-xl-3"
                    key={product.id}
                  >
                    <div className="card h-100 border-0 shadow rounded-3 overflow-hidden">

                      {/* PRODUCT IMAGE */}
                      <Link
                        to={`/product/${product.id}`}
                        className="d-block text-decoration-none"
                        aria-label={`View ${product.name} details`}
                      >
                        <div
                          className="position-relative bg-light overflow-hidden"
                          style={{ aspectRatio: "3 / 4" }}
                        >
                          {product.imageKey ? (
                            <img
                              src={getImageUrl(product.imageKey)}
                              alt={product.name || "REYASA shirt"}
                              className="w-100 h-100"
                              style={{
                                objectFit: "cover",
                                objectPosition: "center",
                                transition: "transform 0.5s ease",
                              }}
                              loading="lazy"
                              onMouseEnter={(event) => {
                                event.currentTarget.style.transform = "scale(1.15)";
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.transform = "scale(1)";
                              }}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="h-100 d-flex align-items-center justify-content-center text-secondary">
                              <i className="bi bi-image fs-1"></i>
                            </div>
                          )}

                          {/* WISHLIST HEART */}
                          <button
                            type="button"
                            className="btn btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-3 d-flex align-items-center justify-content-center"
                            style={{
                              width: "42px",
                              height: "42px",
                              zIndex: 2,
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleWishlist(product);
                            }}
                            disabled={wishlistLoading === product.id}
                            aria-label={
                              addedToWishlist
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                            title={
                              addedToWishlist
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                          >
                            {wishlistLoading === product.id ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                              ></span>
                            ) : (
                              <i
                                className={`bi ${
                                  addedToWishlist
                                    ? "bi-heart-fill text-danger"
                                    : "bi-heart text-dark"
                                }`}
                                style={{ fontSize: "20px" }}
                              ></i>
                            )}
                          </button>

                          {/* STOCK BADGE */}
                          {outOfStock && (
                            <span className="badge text-bg-secondary position-absolute top-0 start-0 m-3">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* PRODUCT DETAILS */}
                      <div className="card-body p-3 d-flex flex-column">
                        <Link
                          to={`/product/${product.id}`}
                          className="text-decoration-none text-dark"
                        >
                          <h5 className="card-title fw-bold text-center mb-3">
                            {product.name}
                          </h5>
                        </Link>

                        {/* SIZE SELECTION */}
                        {sizes.length > 0 && (
                          <div className="mb-3">
                            <label
                              htmlFor={`size-${product.id}`}
                              className="form-label fw-semibold"
                            >
                              Select Size <span className="text-danger">*</span>
                            </label>

                            <select
                              id={`size-${product.id}`}
                              className="form-select"
                              value={selectedSizes[product.id] || ""}
                              onChange={(event) =>
                                handleSizeChange(product.id, event.target.value)
                              }
                            >
                              <option value="">-- Please Select Size --</option>

                              {sizes.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* ADD TO CART */}
                        <button
                          type="button"
                          className="btn btn-dark w-100 mt-auto"
                          disabled={
                            outOfStock ||
                            sizes.length === 0 ||
                            cartLoading === product.id
                          }
                          onClick={() => handleAddToCart(product)}
                        >
                          {cartLoading === product.id
                            ? "Adding..."
                            : outOfStock
                              ? "Out of Stock"
                              : sizes.length === 0
                                ? "No Sizes Available"
                                : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Collection;