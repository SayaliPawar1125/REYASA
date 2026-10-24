
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CartServices from "../services/CartServices";
import heroBackground from "../assets/reyasa-background.png";
import { useNavigate } from "react-router-dom";

function Cart() {
const navigate = useNavigate();

  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const userId = localStorage.getItem("userId");

  // Product image URL
  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";

    if (/^https?:\/\//i.test(imageKey)) {
      return imageKey;
    }

    return `http://localhost:8080/uploads/${encodeURIComponent(
      imageKey
    )}`;
  };

  // REYASA background image
  const pageStyle = {
    backgroundImage: `url(${heroBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
  };

  // Load cart without showing the full-page spinner on every update
  const loadCart = useCallback(
    async (showLoader = false) => {
      if (!userId || userId === "undefined" || userId === "null") {
        setCart({ items: [], subtotal: 0, total: 0 });
        setLoading(false);
        setError("Please log in to view your shopping cart.");
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const response = await CartServices.getCartItems(userId);
        const data = response.data || {};

        setCart({
          items: Array.isArray(data.items) ? data.items : [],
          subtotal: Number(data.subtotal || 0),
          total: Number(data.total || 0),
        });
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

  // Load cart when the component opens
  useEffect(() => {
    loadCart(true);
  }, [loadCart]);

  // Increase or decrease quantity
  const changeQuantity = async (item, change) => {
    if (updatingId !== null) return;

    const currentQuantity = Number(item.quantity);
    const newQuantity = currentQuantity + change;
    const stockQuantity = Number(item.stockQuantity);

    if (newQuantity < 1) {
      setError("Quantity cannot be less than 1.");
      return;
    }

    // A positive stock quantity represents a limited-stock product.
    // Zero or missing stock is treated as unlimited by this frontend.
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

  // Remove item from cart
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

  // Format price in Indian Rupees
  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Initial loading screen
  if (loading) {
    return (
      <main
        className="container-fluid py-5 text-center"
        style={pageStyle}
      >
        <div className="container-lg">
          <div className="bg-white bg-opacity-90 rounded-3 p-5 d-inline-block">
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 mb-0">
              Loading your shopping cart...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Login required
  if (!userId || userId === "undefined" || userId === "null") {
    return (
      <main className="container-fluid py-5" style={pageStyle}>
        <div className="container-lg">
          <div className="bg-white rounded-3 shadow-sm p-4">
            <h2 className="mb-3">Shopping Cart</h2>

            <div className="alert alert-warning">
              Please log in to view your shopping cart.
            </div>

            <Link to="/login" className="btn btn-dark">
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="container-fluid py-4 py-md-5"
      style={pageStyle}
    >
      <div className="container-lg">
        <div className="row g-4">
          {/* Cart Items */}
          <section className="col-12 col-lg-8">
            <div className="bg-white border rounded-2 shadow-sm p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <h2 className="h3 mb-0">Shopping Cart</h2>

                <span className="text-secondary small">
                  {cart.items.length}{" "}
                  {cart.items.length === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Messages */}
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
                  />
                </div>
              )}

              {/* Empty Cart */}
              {cart.items.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-cart3 display-1 text-secondary" />

                  <h4 className="mt-3">
                    Your REYASA cart is empty
                  </h4>

                  <p className="text-secondary">
                    Discover shirts and add your favourites to your cart.
                  </p>

                  <Link to="/collection" className="btn btn-dark">
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                cart.items.map((item) => {
                  const stockQuantity = Number(item.stockQuantity);
                  const isUpdating = updatingId === item.id;

                  return (
                    <article
                      key={item.id}
                      className="row g-3 py-4 border-bottom"
                    >
                      {/* Product Image */}
                      <div className="col-4 col-md-3">
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
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <i className="bi bi-image fs-1 text-secondary" />
                          )}
                        </div>
                      </div>

                      {/* Product Details */}
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

                        {/* Quantity Controls */}
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <div className="btn-group border rounded-pill overflow-hidden">
                            <button
                              type="button"
                              className="btn btn-light border-0"
                              aria-label="Decrease quantity"
                              disabled={
                                Number(item.quantity) <= 1 || isUpdating
                              }
                              onClick={() => changeQuantity(item, -1)}
                            >
                              <i className="bi bi-dash-lg" />
                            </button>

                            <span
                              className="btn btn-light border-0 px-3"
                              aria-live="polite"
                            >
                              {isUpdating ? "..." : item.quantity}
                            </span>

                            {/* Keep this enabled at the stock limit so the
                                user can click and see the stock message. */}
                            <button
                              type="button"
                              className="btn btn-light border-0"
                              aria-label="Increase quantity"
                              disabled={isUpdating}
                              onClick={() => changeQuantity(item, 1)}
                            >
                              <i className="bi bi-plus-lg" />
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

                        {/* Stock information */}
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
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* Order Summary */}
          <aside className="col-12 col-lg-4">
            <div className="border rounded-2 shadow-sm p-4 bg-white">
              <h4 className="h5 mb-4">Order Summary</h4>

              <div className="d-flex justify-content-between mb-3">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <span>Delivery</span>
                <span className="text-success">FREE</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>

              
<button
  type="button"
  className="btn btn-dark w-100"
  disabled={cart.items.length === 0}
  onClick={() => navigate("/checkout")}
>
  <i className="bi bi-bag-check me-2"></i>
  Buy Now
</button>
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
