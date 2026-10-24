import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ManageProductServices from "../services/ManageProductServices";
import CartServices from "../services/CartServices";
import reyasaBackground from "../assets/reyasa-background.png";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const black = "#000000";

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await ManageProductServices.getProductById(id);

        if (!cancelled) {
          setProduct(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load this product."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";

    if (/^https?:\/\//i.test(imageKey)) {
      return imageKey;
    }

    return `http://localhost:8080/uploads/${encodeURIComponent(
      imageKey
    )}`;
  };

  const getSizes = () => {
    if (!product) return [];

    const rawSizes =
      product.availableSizes ??
      product.sizes ??
      product.size;

    if (Array.isArray(rawSizes)) {
      return rawSizes;
    }

    if (typeof rawSizes === "string") {
      return rawSizes
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean);
    }

    return [];
  };

  const sizes = getSizes();

  const formatPrice = (price) =>
    `₹${Number(price || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const checkDelivery = () => {
    if (!/^\d{6}$/.test(pincode)) {
      setDeliveryMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    setDeliveryMessage(
      "PIN code format is valid. Actual delivery availability must be verified."
    );
  };

  const handleAddToCart = async (buyNow = false) => {
    const userId = Number(localStorage.getItem("userId"));

    if (!userId) {
      navigate("/login");
      return;
    }

    if (!product) return;

    if (sizes.length > 0 && !selectedSize) {
      setError("Please select a size before continuing.");
      setSuccessMessage("");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Please enter a valid quantity.");
      setSuccessMessage("");
      return;
    }

    if (
      product.stockQuantity != null &&
      quantity > Number(product.stockQuantity)
    ) {
      setError(
        Number(product.stockQuantity) > 0
          ? `Only ${product.stockQuantity} units are available.`
          : "This product is out of stock."
      );
      setSuccessMessage("");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setSuccessMessage("");

      await CartServices.addToCart(
        product.id,
        userId,
        selectedSize,
        quantity
      );

      window.dispatchEvent(new Event("cartUpdated"));

      if (buyNow) {
        navigate("/checkout");
      } else {
        setSuccessMessage("Product added to your REYASA cart!");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "Unable to add this product to your cart.")
      );
    } finally {
      setBusy(false);
    }
  };

  const isOutOfStock =
    product?.stockQuantity != null &&
    Number(product.stockQuantity) <= 0;

  const backgroundStyle = {
    backgroundImage: `url(${reyasaBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  };

  if (loading) {
    return (
      <main
        className="min-vh-100 d-flex justify-content-center align-items-center"
        style={backgroundStyle}
      >
        <div className="bg-white rounded-3 shadow p-5 text-center">
          <div
            className="spinner-border"
            style={{ color: black }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>

          <p className="mt-3 mb-0" style={{ color: black }}>
            Loading product details...
          </p>
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="min-vh-100" style={backgroundStyle}>
        <div className="container py-5">
          <div className="alert alert-warning">
            <p>{error}</p>
            <Link to="/collection" className="btn btn-dark">
              Back to Collection
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!product) return null;

  const imageKey =
    product.imageKey ||
    product.imageUrl ||
    product.image;

  return (
    <main className="min-vh-100" style={backgroundStyle}>
      <div className="container py-4 py-lg-5">
        {/* Breadcrumb — no duplicate navbar */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb bg-white rounded-3 shadow-sm p-3 mb-0">
            <li className="breadcrumb-item">
              <Link
                to="/"
                className="text-decoration-none text-black"
              >
                Home
              </Link>
            </li>

            <li className="breadcrumb-item">
              <Link
                to="/collection"
                className="text-decoration-none text-black"
              >
                Collection
              </Link>
            </li>

            <li
              className="breadcrumb-item active"
              aria-current="page"
            >
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="row g-4 align-items-start">
          {/* LEFT CARD: Product Image */}
          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow rounded-3 overflow-hidden">
              <div className="card-body bg-light p-3 p-md-4">
                {imageKey ? (
                  <div className="bg-white rounded-3 d-flex align-items-center justify-content-center p-3">
                    <img
                      src={getImageUrl(imageKey)}
                      alt={product.name || "REYASA shirt"}
                      className="img-fluid"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "450px",
                        objectFit: "contain",
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-3 text-center text-secondary py-5">
                    <i className="bi bi-image fs-1"></i>
                    <p className="mb-0 mt-2">
                      Product image unavailable
                    </p>
                  </div>
                )}

                {product.limitedEdition && (
                  <div className="text-center mt-3">
                    <span className="badge bg-black">
                      LIMITED EDITION
                    </span>
                  </div>
                )}
              </div>

              <div className="card-footer bg-white text-center py-3">
                <span className="small text-secondary">
                  {product.category || "REYASA Collection"}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT CARD: Product Details */}
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow rounded-3">
              <div className="card-body p-3 p-md-4 p-xl-5">
                <p className="small text-uppercase text-black mb-2">
                  {product.category || "REYASA COLLECTION"}
                </p>

                <h1 className="h2 fw-bold text-black">
                  {product.name}
                </h1>

                <h2 className="h3 fw-bold text-black mb-3">
                  {formatPrice(product.price)}
                </h2>

                {product.limitedEdition && (
                  <span className="badge bg-black mb-3">
                    Limited Edition
                  </span>
                )}

                <hr />

                {/* Description */}
                {product.description && (
                  <div className="mb-4">
                    <h3 className="h6 fw-bold text-black">
                      Product Description
                    </h3>

                    <p className="text-secondary mb-0">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Product Information */}
                <h3 className="h6 fw-bold text-black mb-3">
                  Product Information
                </h3>

                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <tbody>
                      {product.material && (
                        <tr>
                          <th className="text-secondary fw-normal">
                            Material
                          </th>
                          <td className="text-end">
                            {product.material}
                          </td>
                        </tr>
                      )}

                      {product.fit && (
                        <tr>
                          <th className="text-secondary fw-normal">
                            Fit
                          </th>
                          <td className="text-end">
                            {product.fit}
                          </td>
                        </tr>
                      )}

                      {product.stockQuantity != null && (
                        <tr>
                          <th className="text-secondary fw-normal">
                            Availability
                          </th>
                          <td
                            className={`text-end fw-semibold ${
                              isOutOfStock
                                ? "text-danger"
                                : "text-success"
                            }`}
                          >
                            {isOutOfStock
                              ? "Out of stock"
                              : `${product.stockQuantity} in stock`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <hr />

                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="h6 fw-bold text-black mb-3">
                      Select Size
                    </h3>

                    <div className="d-flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`btn ${
                            selectedSize === size
                              ? "btn-dark"
                              : "btn-outline-dark"
                          }`}
                          aria-pressed={selectedSize === size}
                          onClick={() => {
                            setSelectedSize(size);
                            setError("");
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-4">
                  <label
                    htmlFor="quantity"
                    className="form-label fw-semibold text-black"
                  >
                    Quantity
                  </label>

                  <div
                    className="input-group"
                    style={{ maxWidth: "160px" }}
                  >
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                      onClick={() =>
                        setQuantity((current) =>
                          Math.max(1, current - 1)
                        )
                      }
                    >
                      −
                    </button>

                    <input
                      id="quantity"
                      type="number"
                      className="form-control text-center"
                      min="1"
                      max={
                        product.stockQuantity != null
                          ? product.stockQuantity
                          : undefined
                      }
                      value={quantity}
                      onChange={(event) => {
                        const value = Number(event.target.value);

                        if (
                          Number.isInteger(value) &&
                          value >= 1 &&
                          (product.stockQuantity == null ||
                            value <= Number(product.stockQuantity))
                        ) {
                          setQuantity(value);
                        }
                      }}
                    />

                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      aria-label="Increase quantity"
                      disabled={
                        product.stockQuantity != null &&
                        quantity >= Number(product.stockQuantity)
                      }
                      onClick={() =>
                        setQuantity((current) => current + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Delivery PIN */}
                <div className="card bg-light border mb-4">
                  <div className="card-body">
                    <h3 className="h6 fw-bold text-black">
                      <i className="bi bi-geo-alt me-2"></i>
                      Check Delivery
                    </h3>

                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter 6-digit PIN code"
                        value={pincode}
                        maxLength={6}
                        inputMode="numeric"
                        onChange={(event) => {
                          setPincode(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6)
                          );
                          setDeliveryMessage("");
                        }}
                      />

                      <button
                        type="button"
                        className="btn btn-outline-dark"
                        onClick={checkDelivery}
                      >
                        Check
                      </button>
                    </div>

                    {deliveryMessage && (
                      <p className="small mt-2 mb-0" role="status">
                        {deliveryMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className="alert alert-warning" role="alert">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="alert alert-success" role="status">
                    {successMessage}{" "}
                    <Link to="/cart" className="alert-link">
                      View Cart
                    </Link>
                  </div>
                )}

                {/* Purchase Buttons */}
                <div className="d-grid gap-2 d-sm-flex">
                  <button
                    type="button"
                    className="btn btn-outline-dark flex-fill py-2"
                    disabled={busy || isOutOfStock}
                    onClick={() => handleAddToCart(false)}
                  >
                    <i className="bi bi-bag me-2"></i>
                    {busy ? "Please wait..." : "Add to Cart"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-dark flex-fill py-2"
                    disabled={busy || isOutOfStock}
                    onClick={() => handleAddToCart(true)}
                  >
                    Buy Now
                    <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>

                <hr className="my-4" />

                <div className="d-flex flex-column gap-2 small text-secondary">
                  <div>
                    <i className="bi bi-stars me-2 text-black"></i>
                    Thoughtfully selected styles
                  </div>

                  <div>
                    <i className="bi bi-box-seam me-2 text-black"></i>
                    Delivery details at checkout
                  </div>

                  <div>
                    <i className="bi bi-heart me-2 text-black"></i>
                    Created with passion. Worn with love.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Collection */}
        <div className="text-center mt-4">
          <Link
            to="/collection"
            className="btn btn-outline-dark"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Collection
          </Link>
        </div>
      </div>
    </main>
  );
}

export default ProductDetails;