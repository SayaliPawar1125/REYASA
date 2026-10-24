
import React, { useEffect, useRef, useState } from "react";
import heroBackground from "../assets/reyasa-background.png";
import "./Home.css";
import CartServices from "../services/CartServices";
import ManageProductServices from "../services/ManageProductServices";

const API_URL = "http://localhost:8080";

function Home() {
  const scrollRef = useRef(null);

  const [homepageVideos, setHomepageVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [cartMessage, setCartMessage] = useState("");
  const [cartMessageType, setCartMessageType] = useState("info");
  const [addingProductId, setAddingProductId] = useState(null);

  // Convert available sizes into an array.
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

  // Get product image URL.
  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";

    if (/^https?:\/\//i.test(imageKey)) {
      return imageKey;
    }

    return `${API_URL}/uploads/${encodeURIComponent(imageKey)}`;
  };

  // Get URL for videos and poster images uploaded by the admin.
  const getMediaUrl = (path) => {
    if (!path) return "";

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  // Load only active videos uploaded by the admin.
  // No local or hardcoded video is used.
  const loadHomepageVideos = async () => {
    try {
      setVideosLoading(true);

      const response = await fetch(`${API_URL}/api/videos`);

      if (!response.ok) {
        throw new Error(
          `Video request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      const activeVideos = Array.isArray(data)
        ? data.filter(
            (video) =>
              video.active === true &&
              typeof video.videoUrl === "string" &&
              video.videoUrl.trim() !== ""
          )
        : [];

      // Only one homepage video is allowed.
      setHomepageVideos(activeVideos.slice(0, 1));
    } catch (error) {
      console.error("Unable to load homepage videos:", error);
      setHomepageVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  useEffect(() => {
    loadHomepageVideos();
  }, []);

  // Load trending products selected by the admin.
  const loadTrendingProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError("");

      const response =
        await ManageProductServices.getTrendingProducts();

      const trendingProducts = Array.isArray(response.data)
        ? response.data
        : [];

      setProducts(trendingProducts);

      const initialSizes = {};

      trendingProducts.forEach((product) => {
        const sizes = getAvailableSizes(product.availableSizes);

        if (sizes.length > 0) {
          initialSizes[product.id] = sizes[0];
        }
      });

      setSelectedSizes(initialSizes);
    } catch (error) {
      console.error(
        "Unable to load trending products:",
        error.response?.data || error.message || error
      );

      setProductsError(
        error.response?.status === 401 ||
          error.response?.status === 403
          ? "You are not authorized to view these products. Check your backend security configuration."
          : "Unable to load trending shirts. Please check whether the backend is running."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadTrendingProducts();
  }, []);

  // Change the selected shirt size.
  const handleSizeChange = (productId, size) => {
    setSelectedSizes((previous) => ({
      ...previous,
      [productId]: size,
    }));
  };

  // Add a shirt to the logged-in customer's cart.
  const handleAddToCart = async (product) => {
    setCartMessage("");

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!token || !userId) {
      setCartMessageType("warning");
      setCartMessage(
        "Please login before adding products to your cart."
      );
      return;
    }

    const availableSizes = getAvailableSizes(
      product.availableSizes
    );

    const size =
      selectedSizes[product.id] || availableSizes[0];

    if (!size || !availableSizes.includes(size)) {
      setCartMessageType("warning");
      setCartMessage("Please select an available shirt size.");
      return;
    }

    if (Number(product.stockQuantity) <= 0) {
      setCartMessageType("warning");
      setCartMessage("This shirt is currently out of stock.");
      return;
    }

    try {
      setAddingProductId(product.id);

      await CartServices.addToCart(
        product.id,
        userId,
        size,
        1
      );

      setCartMessageType("success");
      setCartMessage(
        `${product.name} (${size}) added to your cart successfully.`
      );

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error(
        "Unable to add product to cart:",
        error.response?.data || error.message || error
      );

      const responseData = error.response?.data;

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        setCartMessageType("warning");
        setCartMessage(
          "Your session may have expired. Please login again."
        );
      } else if (error.response?.status === 404) {
        setCartMessageType("danger");
        setCartMessage(
          "Product not found. Refresh the page and try again."
        );
      } else {
        setCartMessageType("danger");
        setCartMessage(
          responseData?.message ||
            responseData?.error ||
            "Unable to add product to cart. Please try again."
        );
      }
    } finally {
      setAddingProductId(null);
    }
  };

  // Automatically scroll trending product cards.
  useEffect(() => {
    const container = scrollRef.current;

    if (!container || products.length <= 1) return;

    const interval = setInterval(() => {
      const currentContainer = scrollRef.current;

      if (!currentContainer) return;

      const card =
        currentContainer.querySelector(".trending-card");

      if (!card) return;

      const cardWidth = card.offsetWidth + 24;

      const maxScrollLeft =
        currentContainer.scrollWidth -
        currentContainer.clientWidth;

      if (maxScrollLeft <= 0) return;

      if (
        currentContainer.scrollLeft >=
        maxScrollLeft - 5
      ) {
        currentContainer.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        currentContainer.scrollBy({
          left: cardWidth,
          behavior: "smooth",
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [products.length]);

  return (
    <>
      {/* HERO SECTION */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url(${heroBackground})`,
        }}
      >
        <div className="hero-overlay">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-small-title">
                <span></span>

                <span className="small-title-text">
                  SUSTAINABLE FASHION
                </span>

                <span></span>
              </div>

              <div className="hero-leaf">
                <i className="bi bi-leaf"></i>
              </div>

              <h1 className="hero-title">REYASA</h1>

              <div className="hero-line"></div>

              <p className="hero-description">
                Wear the vibes.
                <br />
                Own the moment.
              </p>
            </div>
          </div>
        </div>
      </section>

       
{/* ADMIN-UPLOADED HOMEPAGE VIDEO ONLY */}
{!videosLoading && homepageVideos.length > 0 && (
  <section className="container-fluid px-0 py-4">
    {(() => {
      const video = homepageVideos[0];

      const videoUrl = getMediaUrl(video.videoUrl);

      const posterUrl = video.posterImageUrl
        ? getMediaUrl(video.posterImageUrl)
        : undefined;

      return (
        <div key={video.id}>
          <video
            className="w-100 d-block"
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            style={{
              width: "100%",
              height: "70vh",
              maxHeight: "600px",
              minHeight: "300px",
              objectFit: "cover",
            }}
          >
            Your browser does not support HTML video.
          </video>

          <div className="container text-center py-3">
            {video.title && (
              <h3 className="fw-bold">{video.title}</h3>
            )}

            {video.description && (
              <p className="text-muted mb-0">
                {video.description}
              </p>
            )}
          </div>
        </div>
      );
    })()}
  </section>
)}


      {/* TRENDING SHIRTS */}
      <section className="trending-section py-5 bg-white">
        <div className="container py-3">
          <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3
                className="trending-main-title fw-bold"
                style={{ color: "maroon" }}
              >
                Trending Shirts
              </h3>

              <p className="text-muted mb-0">
                Discover the shirts selected by REYASA.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={loadTrendingProducts}
              disabled={loadingProducts}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>

              {loadingProducts
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {/* CART STATUS MESSAGE */}
          {cartMessage && (
            <div
              className={`alert alert-${cartMessageType} alert-dismissible fade show`}
              role="alert"
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

          {/* LOADING PRODUCTS */}
          {loadingProducts && (
            <div className="text-center py-5">
              <div
                className="spinner-border text-dark"
                role="status"
              >
                <span className="visually-hidden">
                  Loading products...
                </span>
              </div>

              <p className="mt-3 mb-0 text-muted">
                Loading trending shirts...
              </p>
            </div>
          )}

          {/* PRODUCT ERROR */}
          {!loadingProducts && productsError && (
            <div className="alert alert-danger" role="alert">
              <p className="mb-2">{productsError}</p>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={loadTrendingProducts}
              >
                Try Again
              </button>
            </div>
          )}

          {/* NO TRENDING PRODUCTS */}
          {!loadingProducts &&
            !productsError &&
            products.length === 0 && (
              <div className="text-center py-5">
                <i
                  className="bi bi-stars"
                  style={{
                    fontSize: "42px",
                    color: "maroon",
                  }}
                ></i>

                <h5 className="mt-3 fw-semibold">
                  No Trending Shirts Yet
                </h5>

                <p className="text-muted mb-0">
                  Our latest trending shirts will appear here soon.
                </p>
              </div>
            )}

          {/* TRENDING PRODUCT CARDS */}
          {!loadingProducts &&
            !productsError &&
            products.length > 0 && (
              <div
                ref={scrollRef}
                className="trending-scroll-container d-flex flex-nowrap overflow-x-auto pb-4 pt-2 gap-4 visible-scrollbar"
              >
                {products.map((product) => {
                  const availableSizes = getAvailableSizes(
                    product.availableSizes
                  );

                  const selectedSize =
                    selectedSizes[product.id] ||
                    availableSizes[0] ||
                    "";

                  const outOfStock =
                    Number(product.stockQuantity) <= 0;

                  return (
                    <div
                      key={product.id}
                      className="trending-card card border-0 flex-shrink-0 rounded-3"
                    >
                      {/* PRODUCT IMAGE */}
                      <div className="overflow-hidden position-relative image-wrapper">
                        {product.imageKey ? (
                          <img
                            src={getImageUrl(product.imageKey)}
                            className="w-100 object-fit-cover trending-img"
                            alt={product.name}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.visibility =
                                "hidden";
                            }}
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                            <i className="bi bi-image fs-1"></i>
                          </div>
                        )}

                        {product.category && (
                          <span className="badge bg-dark position-absolute top-0 start-0 m-2">
                            {product.category}
                          </span>
                        )}
                      </div>

                      {/* PRODUCT DETAILS */}
                      <div className="card-body p-3 bg-white rounded-bottom-3">
                        <span className="text-muted small d-block mb-1">
                          {product.category}
                        </span>

                        <h6 className="card-title text-truncate fw-semibold text-dark mb-2">
                          {product.name}
                        </h6>

                        {product.description && (
                          <p
                            className="text-muted small mb-2"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {product.description}
                          </p>
                        )}

                        {/* SIZE SELECTOR */}
                        <div className="mb-3">
                          <label
                            htmlFor={`home-size-${product.id}`}
                            className="form-label small fw-semibold mb-1"
                          >
                            Select Size
                          </label>

                          <select
                            id={`home-size-${product.id}`}
                            className="form-select form-select-sm"
                            value={selectedSize}
                            onChange={(event) =>
                              handleSizeChange(
                                product.id,
                                event.target.value
                              )
                            }
                            disabled={
                              availableSizes.length === 0
                            }
                          >
                            {availableSizes.length === 0 ? (
                              <option value="">
                                No sizes available
                              </option>
                            ) : (
                              availableSizes.map((size) => (
                                <option
                                  key={size}
                                  value={size}
                                >
                                  {size}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* PRICE AND ADD TO CART */}
                        <div className="d-flex justify-content-between align-items-center mt-3 gap-2">
                          <span className="fw-bold text-dark">
                            ₹
                            {Number(
                              product.price
                            ).toLocaleString("en-IN")}
                          </span>

                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm custom-cart-btn px-3"
                            onClick={() =>
                              handleAddToCart(product)
                            }
                            disabled={
                              addingProductId === product.id ||
                              outOfStock ||
                              availableSizes.length === 0
                            }
                          >
                            {addingProductId === product.id
                              ? "Adding..."
                              : outOfStock
                                ? "Out of Stock"
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
    </>
  );
}

export default Home;
