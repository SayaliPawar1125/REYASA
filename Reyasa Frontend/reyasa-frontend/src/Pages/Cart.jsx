import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import CartServices from "../services/CartServices";
import heroBackground from "../assets/reyasa-background.png";

const MAROON = "#800000";

function Cart() {
  const navigate = useNavigate();
  const loginPopupShown = useRef(false);

  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    total: 0,
  });

  const [selectedItems, setSelectedItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const userId = localStorage.getItem("userId");

  const isLoggedIn =
    Boolean(userId) &&
    userId !== "undefined" &&
    userId !== "null";

  // ==========================================
  // LOGIN POPUP
  // ==========================================

  useEffect(() => {
    if (isLoggedIn || loginPopupShown.current) {
      return;
    }

    loginPopupShown.current = true;

    Swal.fire({
      icon: "warning",
      title: "Login Required!",
      text: "Please log in to your REYASA account to view your shopping cart and manage your favourite products.",
      confirmButtonText: "Login Now",
      cancelButtonText: "Continue Shopping",
      showCancelButton: true,
      confirmButtonColor: MAROON,
      cancelButtonColor: "#555555",
      background: "#fffaf7",
      color: "#252525",
      width: "420px",
      padding: "2.5rem 2rem",
      allowOutsideClick: false,

      customClass: {
        popup: "reyasa-popup",
        title: "reyasa-popup-title",
        htmlContainer: "reyasa-popup-message",
        confirmButton: "reyasa-popup-button",
        cancelButton: "reyasa-popup-cancel-button",
      },

      buttonsStyling: true,
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/login");
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        navigate("/collection");
      }
    });
  }, [isLoggedIn, navigate]);

  // ==========================================
  // PRODUCT IMAGE URL
  // ==========================================

  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";

    if (/^https?:\/\//i.test(imageKey)) {
      return imageKey;
    }

    if (imageKey.startsWith("/")) {
      return `http://localhost:8080${imageKey}`;
    }

    return `http://localhost:8080/uploads/${encodeURIComponent(
      imageKey
    )}`;
  };

  // ==========================================
  // BACKGROUND IMAGE
  // ==========================================

  const pageStyle = {
    backgroundImage: `url(${heroBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
  };

  // ==========================================
  // LOAD CART
  // ==========================================

  const loadCart = useCallback(
    async (showLoader = false) => {
      if (
        !userId ||
        userId === "undefined" ||
        userId === "null"
      ) {
        setCart({
          items: [],
          subtotal: 0,
          total: 0,
        });

        setSelectedItems([]);
        setLoading(false);
        setError("");
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const response = await CartServices.getCartItems(userId);
        const data = response.data || {};

        const cartItems = Array.isArray(data.items)
          ? data.items
          : [];

        setCart({
          items: cartItems,
          subtotal: Number(data.subtotal || 0),
          total: Number(data.total || 0),
        });

        // Select all products when the cart first loads.
        if (showLoader) {
          setSelectedItems(
            cartItems.map((item) => String(item.id))
          );
        } else {
          // Keep only selections for products that still exist.
          setSelectedItems((previous) =>
            previous.filter((id) =>
              cartItems.some(
                (item) => String(item.id) === String(id)
              )
            )
          );
        }
      } catch (err) {
        console.error(
          "Load cart error:",
          err.response?.data || err.message
        );

        setError(
          err.response?.data?.message ||
            err.response?.data?.detail ||
            "Unable to load your cart. Please try again."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [userId]
  );

  // ==========================================
  // LOAD CART WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {
    loadCart(true);
  }, [loadCart]);

  // ==========================================
  // CHECK WHETHER ITEM IS SELECTED
  // ==========================================

  const isItemSelected = (itemId) => {
    return selectedItems.includes(String(itemId));
  };

  // ==========================================
  // SELECT / DESELECT INDIVIDUAL PRODUCT
  // ==========================================

  const handleItemSelection = (itemId) => {
    const id = String(itemId);

    setSelectedItems((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  // ==========================================
  // SELECT ALL / DESELECT ALL
  // ==========================================

  const allSelected =
    cart.items.length > 0 &&
    cart.items.every((item) =>
      selectedItems.includes(String(item.id))
    );

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(
        cart.items.map((item) => String(item.id))
      );
    }
  };

  // ==========================================
  // GET SELECTED PRODUCTS
  // ==========================================

  const selectedCartItems = cart.items.filter((item) =>
    selectedItems.includes(String(item.id))
  );

  // ==========================================
  // CALCULATE SELECTED SUBTOTAL
  // ==========================================

  const selectedSubtotal = selectedCartItems.reduce(
    (total, item) => {
      const itemTotal =
        item.itemTotal !== undefined &&
        item.itemTotal !== null
          ? Number(item.itemTotal)
          : Number(item.price || 0) *
            Number(item.quantity || 0);

      return total + itemTotal;
    },
    0
  );

  // FREE DELIVERY
  const selectedDelivery = 0;

  const selectedTotal =
    selectedSubtotal + selectedDelivery;

  // ==========================================
  // INCREASE / DECREASE QUANTITY
  // ==========================================

  const changeQuantity = async (item, change) => {
    if (updatingId !== null) return;

    const currentQuantity = Number(item.quantity);
    const newQuantity = currentQuantity + change;
    const stockQuantity = Number(item.stockQuantity);

    if (newQuantity < 1) {
      setError("Quantity cannot be less than 1.");
      return;
    }

    if (
      change > 0 &&
      Number.isFinite(stockQuantity) &&
      stockQuantity > 0 &&
      newQuantity > stockQuantity
    ) {
      setError(
        `Sorry! Only ${stockQuantity} units of "${item.name}" are currently available.`
      );
      return;
    }

    try {
      setUpdatingId(item.id);
      setError("");

      await CartServices.updateQuantity(
        item.id,
        userId,
        newQuantity
      );

      await loadCart(false);

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error(
        "Update quantity error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to update quantity. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // REMOVE ITEM FROM CART
  // ==========================================

  const removeItem = async (item) => {
    if (updatingId !== null) return;

    try {
      setUpdatingId(item.id);
      setError("");

      await CartServices.removeCartItem(item.id, userId);

      await loadCart(false);

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error(
        "Remove cart item error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to remove this item."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // FORMAT PRICE
  // ==========================================

  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ==========================================
  // BUY SELECTED PRODUCTS
  // ==========================================

  const handleBuyNow = () => {
    if (selectedCartItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Select Products",
        text: "Please select at least one product before proceeding to checkout.",
        confirmButtonText: "OK",
        confirmButtonColor: MAROON,
      });

      return;
    }

    // Pass only selected cart products to checkout.
    navigate("/checkout", {
      state: {
        selectedItems: selectedCartItems,
        subtotal: selectedSubtotal,
        delivery: selectedDelivery,
        total: selectedTotal,
      },
    });
  };

  // ==========================================
  // INITIAL LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <main
        className="container-fluid py-5 text-center"
        style={pageStyle}
      >
        <div className="container-lg">
          <div className="bg-white bg-opacity-90 rounded-3 p-5 d-inline-block">
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">
                Loading...
              </span>
            </div>

            <p className="mt-3 mb-0">
              Loading your shopping cart...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // LOGIN REQUIRED PAGE
  // ==========================================

  if (!isLoggedIn) {
    return (
      <main
        className="container-fluid py-5"
        style={pageStyle}
      >
        <div className="container-lg">
          <div className="bg-white rounded-3 shadow-sm p-4 text-center">
            <i
              className="bi bi-lock display-3 mb-3 d-block"
              style={{ color: MAROON }}
            ></i>

            <h2 className="mb-3">
              Your REYASA Shopping Cart
            </h2>

            <p className="text-secondary">
              Please log in to view your shopping cart and manage
              your favourite products.
            </p>

            <button
              type="button"
              className="btn text-white me-2"
              style={{ backgroundColor: MAROON }}
              onClick={() => navigate("/login")}
            >
              <i className="bi bi-person me-2"></i>
              Login Now
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // CART UI
  // ==========================================

  return (
    <main
      className="container-fluid py-4 py-md-5"
      style={pageStyle}
    >
      <div className="container-lg">
        <div className="row g-4">

          {/* CART ITEMS */}

          <section className="col-12 col-lg-8">
            <div className="bg-white border rounded-2 shadow-sm p-3 p-md-4">

              {/* CART HEADER */}

              <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3 gap-3">
                <h2 className="h3 mb-0">
                  Shopping Cart
                </h2>

                <span className="text-secondary small">
                  {cart.items.length}{" "}
                  {cart.items.length === 1 ? "item" : "items"}
                </span>
              </div>

              {/* SELECT ALL */}

              {cart.items.length > 0 && (
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="selectAll"
                      checked={allSelected}
                      onChange={handleSelectAll}
                    />

                    <label
                      className="form-check-label fw-semibold"
                      htmlFor="selectAll"
                    >
                      Select All Products
                    </label>
                  </div>

                  <span className="small text-secondary">
                    {selectedCartItems.length} of{" "}
                    {cart.items.length} selected
                  </span>
                </div>
              )}

              {/* ERROR MESSAGE */}

              {error && (
                <div
                  className="alert alert-warning alert-dismissible fade show"
                  role="alert"
                >
                  {error}

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setError("")}
                  ></button>
                </div>
              )}

              {/* EMPTY CART */}

              {cart.items.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-cart3 display-1 text-secondary"></i>

                  <h4 className="mt-3">
                    Your REYASA cart is empty
                  </h4>

                  <p className="text-secondary">
                    Discover shirts and add your favourites to your cart.
                  </p>

                  <Link
                    to="/collection"
                    className="btn btn-dark"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (

                /* PRODUCT LIST */

                cart.items.map((item) => {
                  const stockQuantity = Number(item.stockQuantity);
                  const isUpdating = updatingId === item.id;
                  const checked = isItemSelected(item.id);

                  return (
                    <article
                      key={item.id}
                      className={`row g-3 py-4 border-bottom ${
                        checked ? "bg-light bg-opacity-50" : ""
                      }`}
                    >

                      {/* PRODUCT IMAGE AND CHECKBOX */}

                      <div className="col-4 col-md-3">

                        <div className="position-relative">

                          {/* PRODUCT CHECKBOX */}

                          <div className="position-absolute top-0 start-0 m-2 bg-white rounded shadow-sm p-2">
                            <input
                              className="form-check-input m-0"
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                handleItemSelection(item.id)
                              }
                              aria-label={`Select ${item.name}`}
                            />
                          </div>

                          {/* IMAGE */}

                          <div
                            className="bg-light rounded-2 d-flex align-items-center justify-content-center overflow-hidden"
                            style={{
                              minHeight: "150px",
                              aspectRatio: "3 / 4",
                            }}
                          >
                            {item.imageKey ? (
                              <img
                                src={getImageUrl(item.imageKey)}
                                alt={item.name}
                                className="img-fluid w-100 h-100"
                                style={{
                                  objectFit: "contain",
                                  maxHeight: "230px",
                                }}
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <i className="bi bi-image fs-1 text-secondary"></i>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* PRODUCT DETAILS */}

                      <div className="col-8 col-md-9">

                        <div className="d-flex justify-content-between gap-2">

                          <div>
                            <h5 className="fs-6 fw-semibold mb-2">
                              {item.name}
                            </h5>

                            <p className="small text-secondary mb-2">
                              {item.category || "REYASA Shirt"}
                            </p>
                          </div>

                          <strong className="text-nowrap">
                            {formatPrice(item.itemTotal)}
                          </strong>

                        </div>

                        <p className="small mb-1">
                          <strong>Size:</strong> {item.size}
                        </p>

                        <p className="small mb-3">
                          <strong>Colour:</strong> See product
                        </p>

                        {/* QUANTITY CONTROLS */}

                        <div className="d-flex flex-wrap align-items-center gap-2">

                          <div className="btn-group border rounded-pill overflow-hidden">

                            <button
                              type="button"
                              className="btn btn-light border-0"
                              aria-label="Decrease quantity"
                              disabled={
                                Number(item.quantity) <= 1 ||
                                isUpdating
                              }
                              onClick={() =>
                                changeQuantity(item, -1)
                              }
                            >
                              <i className="bi bi-dash-lg"></i>
                            </button>

                            <span
                              className="btn btn-light border-0 px-3"
                              aria-live="polite"
                            >
                              {isUpdating ? "..." : item.quantity}
                            </span>

                            <button
                              type="button"
                              className="btn btn-light border-0"
                              aria-label="Increase quantity"
                              disabled={isUpdating}
                              onClick={() =>
                                changeQuantity(item, 1)
                              }
                            >
                              <i className="bi bi-plus-lg"></i>
                            </button>

                          </div>

                          <span className="text-secondary">|</span>

                          <button
                            type="button"
                            className="btn btn-link btn-sm text-danger text-decoration-none"
                            disabled={isUpdating}
                            onClick={() => removeItem(item)}
                          >
                            {isUpdating ? "Please wait..." : "Delete"}
                          </button>

                          <span className="text-secondary">|</span>

                          <Link
                            to="/collection"
                            className="btn btn-link btn-sm text-decoration-none"
                          >
                            Continue shopping
                          </Link>

                        </div>

                        {/* STOCK INFORMATION */}

                        {Number.isFinite(stockQuantity) &&
                          stockQuantity > 0 &&
                          Number(item.quantity) >= stockQuantity && (
                            <p className="small text-danger mt-2 mb-0">
                              Maximum available quantity reached.
                            </p>
                          )}

                        <p className="small text-secondary mt-2 mb-0">
                          Unit price: {formatPrice(item.price)}
                        </p>

                        {/* SELECTION STATUS */}

                        <p className={`small mt-2 mb-0 fw-semibold ${
                          checked ? "text-success" : "text-secondary"
                        }`}>
                          {checked
                            ? "✓ Selected for checkout"
                            : "Not selected for checkout"}
                        </p>

                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* ORDER SUMMARY */}

          <aside className="col-12 col-lg-4">
            <div className="border rounded-2 shadow-sm p-4 bg-white">

              <h4 className="h5 mb-4">
                Order Summary
              </h4>

              {/* SELECTED PRODUCTS COUNT */}

              <div className="d-flex justify-content-between mb-3">
                <span>Selected Products</span>

                <strong>
                  {selectedCartItems.length}
                </strong>
              </div>

              {/* SELECTED SUBTOTAL */}

              <div className="d-flex justify-content-between mb-3">
                <span>Subtotal</span>

                <span>
                  {formatPrice(selectedSubtotal)}
                </span>
              </div>

              {/* DELIVERY */}

              <div className="d-flex justify-content-between mb-3">
                <span>Delivery</span>

                <span className="text-success">
                  FREE
                </span>
              </div>

              <hr />

              {/* SELECTED TOTAL */}

              <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                <span>Total</span>

                <span>
                  {formatPrice(selectedTotal)}
                </span>
              </div>

              {/* BUY SELECTED PRODUCTS */}

              <button
                type="button"
                className="btn btn-dark w-100"
                disabled={selectedCartItems.length === 0}
                onClick={handleBuyNow}
              >
                <i className="bi bi-bag-check me-2"></i>

                Buy Now ({selectedCartItems.length})
              </button>

              {selectedCartItems.length === 0 && (
                <p className="text-danger small text-center mt-2 mb-0">
                  Please select at least one product.
                </p>
              )}

              <Link
                to="/collection"
                className="btn btn-outline-dark w-100 mt-2"
              >
                Continue Shopping
              </Link>

            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}

export default Cart;