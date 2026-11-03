import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import WishlistService from "../services/WishlistService";
import CartServices from "../services/CartServices";
import heroBackground from "../assets/reyasa-background.png";

const API_URL = "http://localhost:8080";
const MAROON = "#800000";

function Wishlist() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const [cartMessage, setCartMessage] = useState("");
  const [showCartToast, setShowCartToast] = useState(false);

  // GET PRODUCT IMAGE URL
  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";

    if (imageKey.startsWith("http")) return imageKey;

    if (imageKey.startsWith("/")) {
      return `${API_URL}${imageKey}`;
    }

    return `${API_URL}/uploads/${encodeURIComponent(imageKey)}`;
  };

  // GET AVAILABLE SIZES
  const getAvailableSizes = (sizes) => {
    if (Array.isArray(sizes)) {
      return sizes.map((size) => String(size).trim()).filter(Boolean);
    }

    if (typeof sizes === "string") {
      return sizes.split(",").map((size) => size.trim()).filter(Boolean);
    }

    return [];
  };

  // MAROON POPUP
  const showMaroonPopup = (options) => {
    return Swal.fire({
      ...options,
      confirmButtonColor: MAROON,
      color: MAROON,
      didOpen: (popup) => {
        const title = popup.querySelector(".swal2-title");
        const message = popup.querySelector(".swal2-html-container");
        const button = popup.querySelector(".swal2-confirm");

        if (title) title.style.color = MAROON;
        if (message) message.style.color = MAROON;

        if (button) {
          button.style.backgroundColor = MAROON;
          button.style.color = "#ffffff";
        }
      },
    });
  };

  // SHOW SUCCESS TOAST FOR CART AND WISHLIST
  const showSuccessToast = (message) => {
    setCartMessage(message);
    setShowCartToast(true);
  };

  // HIDE TOAST AFTER 3 SECONDS
  useEffect(() => {
    if (!showCartToast) return;

    const timer = setTimeout(() => {
      setShowCartToast(false);
      setCartMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [showCartToast, cartMessage]);

  // LOAD WISHLIST
  const loadWishlist = async () => {
    try {
      if (!localStorage.getItem("token")) {
        navigate("/login");
        return;
      }

      const response = await WishlistService.getWishlist();

      setWishlist(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Wishlist error:", error);

      if ([401, 403].includes(error.response?.status)) {
        await showMaroonPopup({
          icon: "warning",
          title: "Please Login",
          text: "Please login to view your wishlist.",
        });

        navigate("/login");
      } else {
        showMaroonPopup({
          icon: "error",
          title: "Error",
          text: "Unable to load wishlist.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  // CHANGE SELECTED SIZE
  const handleSizeChange = (productId, size) => {
    setSelectedSizes((previous) => ({
      ...previous,
      [productId]: size,
    }));
  };

  // ADD TO CART
  const handleAddToCart = async (product) => {
    setShowCartToast(false);

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId || userId === "undefined" || userId === "null") {
      const result = await showMaroonPopup({
        icon: "warning",
        title: "Please Login to REYASA",
        text: "Please login before adding products to your cart.",
        confirmButtonText: "Login Now",
      });

      if (result.isConfirmed) navigate("/login");
      return;
    }

    if (Number(product.stockQuantity) <= 0) {
      showMaroonPopup({
        icon: "warning",
        title: "Out of Stock",
        text: "This product is currently out of stock.",
      });
      return;
    }

    const sizes = getAvailableSizes(product.availableSizes);
    const size = selectedSizes[product.productId];

    if (sizes.length === 0) {
      showMaroonPopup({
        icon: "warning",
        title: "Size Not Available",
        text: "No sizes are available for this product.",
      });
      return;
    }

    if (!size || !sizes.includes(size)) {
      showMaroonPopup({
        icon: "warning",
        title: "Please Select Size",
        text: "Please select a size before adding this product to your cart.",
      });
      return;
    }

    try {
      setAddingId(product.productId);

      await CartServices.addToCart(
        product.productId,
        userId,
        size,
        1
      );

      window.dispatchEvent(new Event("cartUpdated"));

      showSuccessToast(
        `${product.name} (${size}) added to cart successfully.`
      );
    } catch (error) {
      console.error("Add to cart error:", error);

      showMaroonPopup({
        icon: "error",
        title: "Unable to Add to Cart",
        text:
          error.response?.data?.message ||
          "Unable to add this product to your cart. Please try again.",
      });
    } finally {
      setAddingId(null);
    }
  };

  // REMOVE FROM WISHLIST
  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);

      // GET PRODUCT NAME BEFORE REMOVING
      const product = wishlist.find(
        (item) => String(item.productId) === String(productId)
      );

      await WishlistService.removeFromWishlist(productId);

      // UPDATE WISHLIST
      setWishlist((previous) =>
        previous.filter(
          (item) => String(item.productId) !== String(productId)
        )
      );

      // REMOVE SELECTED SIZE
      setSelectedSizes((previous) => {
        const updated = { ...previous };
        delete updated[productId];
        return updated;
      });

      // UPDATE NAVBAR WISHLIST COUNT
      window.dispatchEvent(new Event("wishlistUpdated"));

      // SHOW SAME SUCCESS TOAST
      showSuccessToast(
        `${product?.name || "Product"} removed from wishlist successfully.`
      );

    } catch (error) {
      console.error("Remove wishlist error:", error);

      showMaroonPopup({
        icon: "error",
        title: "Error",
        text: "Unable to remove product from wishlist.",
      });
    } finally {
      setRemovingId(null);
    }
  };

  // PAGE BACKGROUND
  const pageStyle = {
    backgroundColor: "#f5eee7",
    backgroundImage: `url(${heroBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
    minHeight: "100vh",
    paddingTop: "70px",
  };

  // LOADING
  if (loading) {
    return (
      <main className="container-fluid" style={pageStyle}>
        <div className="container text-center py-5">
          <div
            className="spinner-border"
            style={{ color: MAROON }}
            role="status"
          />
          <p className="mt-3" style={{ color: MAROON }}>
            Loading your wishlist...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container-fluid px-3 px-md-4 pb-5" style={pageStyle}>
      <div className="container">

        {/* HEADING */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <p
              className="text-uppercase fw-bold mb-2"
              style={{ color: MAROON, letterSpacing: "3px" }}
            >
              REYASA COLLECTION
            </p>

            <h2 className="fw-bold" style={{ color: MAROON }}>
              My Wishlist
            </h2>

            <p className="mb-0" style={{ color: MAROON }}>
              Your favourite REYASA products.
            </p>
          </div>

          <span className="badge bg-dark fs-6">
            {wishlist.length} Products
          </span>
        </div>

        {/* SUCCESS TOAST FOR ADD AND REMOVE */}
        {showCartToast && (
          <div
            className="reyasa-cart-notification"
            role="status"
            aria-live="polite"
          >
            <i className="bi bi-check-circle-fill" />

            <p className="reyasa-cart-notification-message mb-0">
              {cartMessage}
            </p>
          </div>
        )}

        {/* EMPTY WISHLIST */}
        {wishlist.length === 0 ? (
          <div className="text-center bg-white rounded-3 shadow-sm py-5">
            <i
              className="bi bi-heart"
              style={{ fontSize: "55px", color: MAROON }}
            />

            <h4 className="fw-semibold mt-3" style={{ color: MAROON }}>
              Your wishlist is empty
            </h4>

            <p className="text-muted">
              You have not added any products to your wishlist yet.
            </p>

            <Link to="/collection" className="btn btn-dark px-4">
              Explore Collection
            </Link>
          </div>
        ) : (

          /* HORIZONTAL PRODUCT CARDS */
          <div className="d-flex flex-column gap-3">
            {wishlist.map((item) => {
              const sizes = getAvailableSizes(item.availableSizes);
              const outOfStock = Number(item.stockQuantity) <= 0;

              return (
                <div
                  className="card border-0 shadow-sm rounded-3 overflow-hidden"
                  key={item.id}
                >
                  <div className="row g-0 align-items-center">

                    {/* PRODUCT IMAGE */}
                    <div className="col-12 col-sm-4 col-md-3">
                      <Link to={`/product/${item.productId}`}>
                        {item.imageKey ? (
                          <img
                            src={getImageUrl(item.imageKey)}
                            alt={item.name}
                            className="img-fluid w-100"
                            style={{
                              height: "230px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            className="d-flex justify-content-center align-items-center bg-light"
                            style={{ height: "230px" }}
                          >
                            <i
                              className="bi bi-image"
                              style={{ fontSize: "45px", color: MAROON }}
                            />
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* PRODUCT DETAILS */}
                    <div className="col-12 col-sm-8 col-md-9">
                      <div className="card-body p-3 p-md-4">

                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                          <div>
                            <Link
                              to={`/product/${item.productId}`}
                              className="text-decoration-none"
                            >
                              <h5
                                className="fw-bold mb-2"
                                style={{ color: MAROON }}
                              >
                                {item.name}
                              </h5>
                            </Link>

                            <p className="text-secondary small mb-2">
                              {item.category || "REYASA Collection"}
                            </p>

                            <h5
                              className="fw-bold mb-3"
                              style={{ color: MAROON }}
                            >
                              ₹{Number(item.price || 0).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </h5>
                          </div>

                          <span
                            className={`badge ${
                              outOfStock ? "text-bg-danger" : "text-bg-success"
                            }`}
                          >
                            {outOfStock ? "Out of Stock" : "In Stock"}
                          </span>
                        </div>

                        {!outOfStock && (
                          <p className="text-secondary small mb-3">
                            Available Quantity: {item.stockQuantity}
                          </p>
                        )}

                        {/* SIZE */}
                        {sizes.length > 0 ? (
                          <div className="mb-3" style={{ maxWidth: "220px" }}>
                            <label
                              htmlFor={`wishlist-size-${item.productId}`}
                              className="form-label fw-semibold"
                            >
                              Select Size <span className="text-danger">*</span>
                            </label>

                            <select
                              id={`wishlist-size-${item.productId}`}
                              className="form-select"
                              value={selectedSizes[item.productId] || ""}
                              onChange={(event) =>
                                handleSizeChange(
                                  item.productId,
                                  event.target.value
                                )
                              }
                              disabled={outOfStock}
                            >
                              <option value="">-- Select Size --</option>

                              {sizes.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <p className="text-danger small fw-semibold">
                            No sizes available
                          </p>
                        )}

                        {/* BUTTONS */}
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-dark"
                            disabled={
                              outOfStock ||
                              sizes.length === 0 ||
                              addingId === item.productId
                            }
                            onClick={() => handleAddToCart(item)}
                          >
                            {addingId === item.productId ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-bag-plus me-2" />
                                Add to Cart
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            disabled={removingId === item.productId}
                            onClick={() => handleRemove(item.productId)}
                          >
                            {removingId === item.productId ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-heartbreak me-2" />
                                Remove from Wishlist
                              </>
                            )}
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center py-4 mt-4">
          <small
            className="fw-semibold"
            style={{ color: MAROON, letterSpacing: "2px" }}
          >
            REYASA · CREATED WITH PASSION. WORN WITH LOVE.
          </small>
        </div>

      </div>
    </main>
  );
}

export default Wishlist;