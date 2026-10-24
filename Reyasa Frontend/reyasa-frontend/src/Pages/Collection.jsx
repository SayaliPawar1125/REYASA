
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ManageProductServices from "../services/ManageProductServices";
import CartServices from "../services/CartServices";
import reyasaBackground from "../assets/reyasa-background.png";

function Collection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSizes, setSelectedSizes] = useState({});
  const [cartLoading, setCartLoading] = useState(null);
  const [cartMessage, setCartMessage] = useState("");
  const [cartMessageType, setCartMessageType] = useState("info");

  // Convert backend sizes such as "S,M,L,XL" into an array.
  const getAvailableSizes = (availableSizes) => {
    if (Array.isArray(availableSizes)) {
      return availableSizes
        .map((size) => String(size).trim())
        .filter(Boolean);
    }

    if (typeof availableSizes === "string") {
      return availableSizes
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean);
    }

    return [];
  };

  // Build the product image URL using the saved backend image key.
  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";

    if (/^https?:\/\//i.test(imageKey)) {
      return imageKey;
    }

    return `http://localhost:8080/uploads/${encodeURIComponent(imageKey)}`;
  };

  // Load products managed by the admin.
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await ManageProductServices.getAllActiveProducts();

      const backendProducts = Array.isArray(response.data)
        ? response.data.filter(
            (product) => product.active !== false
          )
        : [];

      setProducts(backendProducts);

      // Select the first available size for each product by default.
      const initialSizes = {};

      backendProducts.forEach((product) => {
        const sizes = getAvailableSizes(product.availableSizes);

        if (sizes.length > 0) {
          initialSizes[product.id] = sizes[0];
        }
      });

      setSelectedSizes(initialSizes);
    } catch (err) {
      console.error(
        "Collection products error:",
        err.response?.data || err.message || err
      );

      setError(
        err.response?.status === 401 ||
          err.response?.status === 403
          ? "Unable to access products. Please check your backend security configuration."
          : "Unable to load the collection. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Generate category filters from actual backend products.
  const categories = [
    "All",
    ...new Set(
      products.map((product) => product.category).filter(Boolean)
    ),
  ];

  // Apply the selected category and sort newest product IDs first.
  const filteredProducts = products
    .filter(
      (product) =>
        selectedCategory === "All" ||
        product.category === selectedCategory
    )
    .sort((a, b) => Number(b.id) - Number(a.id));

  // Update the selected size for a product.
  const handleSizeChange = (productId, size) => {
    setSelectedSizes((previous) => ({
      ...previous,
      [productId]: size,
    }));
  };

  // Add a real database product to the cart.
  const handleAddToCart = async (product) => {
    setCartMessage("");

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (
      !token ||
      !userId ||
      userId === "undefined" ||
      userId === "null"
    ) {
      setCartMessageType("warning");
      setCartMessage("Please log in to add items to your cart.");
      return;
    }

    if (Number(product.stockQuantity) <= 0) {
      setCartMessageType("warning");
      setCartMessage("This shirt is currently out of stock.");
      return;
    }

    const sizes = getAvailableSizes(product.availableSizes);

    if (sizes.length === 0) {
      setCartMessageType("warning");
      setCartMessage("No sizes are available for this shirt.");
      return;
    }

    const size = selectedSizes[product.id] || sizes[0];

    if (!sizes.includes(size)) {
      setCartMessageType("warning");
      setCartMessage("Please select a valid size.");
      return;
    }

    try {
      setCartLoading(product.id);

      await CartServices.addToCart(
        product.id,
        userId,
        size,
        1
      );

      window.dispatchEvent(new Event("cartUpdated"));

      setCartMessageType("success");
      setCartMessage(
        `${product.name} (${size}) added to cart successfully.`
      );
    } catch (err) {
      console.error(
        "Add to cart error:",
        err.response?.data || err.message || err
      );

      const data = err.response?.data;

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        setCartMessageType("warning");
        setCartMessage(
          "Your session may have expired. Please log in again."
        );
      } else {
        setCartMessageType("danger");
        setCartMessage(
          typeof data === "string"
            ? data
            : data?.message ||
                data?.error ||
                "Unable to add this shirt to your cart."
        );
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
          {/* Collection heading and refresh */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h2
                className="fw-bold mb-1"
                style={{ color: "maroon" }}
              >
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

          {/* Category filters from the backend */}
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

          {/* Cart message */}
          {cartMessage && (
            <div
              className={`alert alert-${cartMessageType} alert-dismissible fade show`}
              role="status"
            >
              {cartMessage}

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setCartMessage("")}
              ></button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <p className="mt-3">Loading collection...</p>
            </div>
          )}

          {/* Error and retry */}
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

          {/* Empty collection */}
          {!loading &&
            !error &&
            filteredProducts.length === 0 && (
              <div className="text-center py-5">
                <i
                  className="bi bi-bag"
                  style={{ fontSize: "42px", color: "maroon" }}
                ></i>

                <h4 className="mt-3">No products available</h4>

                <p className="text-secondary">
                  {products.length === 0
                    ? "Products added by the admin will appear here."
                    : "No products were found in this category."}
                </p>
              </div>
            )}

          {/* Products mapped from the backend */}
          {!loading &&
            !error &&
            filteredProducts.length > 0 && (
              <div className="row g-4">
                {filteredProducts.map((product) => {
                  const sizes = getAvailableSizes(
                    product.availableSizes
                  );

                  const outOfStock =
                    Number(product.stockQuantity) <= 0;

                  const selectedSize =
                    selectedSizes[product.id] || sizes[0] || "";

                  return (
                    <div
                      className="col-12 col-sm-6 col-lg-4 col-xl-3"
                      key={product.id}
                    >
                      <div className="card h-100 border-0 shadow rounded-3 overflow-hidden">
                        {/* Click the image to open product details */}
                        <Link
                          to={`/product/${product.id}`}
                          className="d-block text-decoration-none"
                          aria-label={`View details of ${product.name}`}
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
                                }}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="h-100 d-flex align-items-center justify-content-center text-secondary">
                                No image available
                              </div>
                            )}

                            {product.trending && (
                              <span className="badge text-bg-danger position-absolute top-0 end-0 m-3">
                                <i className="bi bi-fire me-1"></i>
                                Trending
                              </span>
                            )}

                            {outOfStock && (
                              <span className="badge text-bg-secondary position-absolute top-0 start-0 m-3">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </Link>

                        {/* Product information */}
                        <div className="card-body d-flex flex-column p-3">
                          <p className="small text-uppercase text-secondary mb-1">
                            {product.category}
                          </p>

                          <h5 className="card-title fw-bold mb-2">
                            {product.name}
                          </h5>

                          <p className="card-text text-secondary small mb-3">
                            {product.description
                              ? product.description.length > 100
                                ? `${product.description.slice(0, 100)}...`
                                : product.description
                              : "Discover your everyday style with REYASA."}
                          </p>

                          <h5 className="fw-bold mb-3">
                            ₹
                            {Number(product.price).toLocaleString(
                              "en-IN"
                            )}
                          </h5>

                         

                          {/* Add to cart */}
                          <div className="mt-auto d-grid">
                            <button
                              type="button"
                              className="btn btn-dark"
                              disabled={
                                outOfStock ||
                                sizes.length === 0 ||
                                cartLoading === product.id
                              }
                              onClick={() =>
                                handleAddToCart(product)
                              }
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
