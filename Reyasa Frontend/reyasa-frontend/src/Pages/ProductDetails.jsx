import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import reyasaBackground from "../assets/reyasa-background.png";

const API_URL = "http://localhost:8080/api";
const IMAGE_BASE_URL = "http://localhost:8080/uploads/";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

// Convert the image key into a complete image URL.
const getImageUrl = (imageKey) => {
  if (!imageKey || typeof imageKey !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(imageKey)) {
    return imageKey;
  }

  const fileName = imageKey
    .replace(/^\/+/, "")
    .replace(/^uploads\//i, "");

  return (
    IMAGE_BASE_URL +
    fileName
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")
  );
};

// Collect all product images without duplicates.
const getProductImages = (product) => {
  if (!product) {
    return [];
  }

  const imageList = [
    ...(Array.isArray(product.imageKeys) ? product.imageKeys : []),
    product.imageKey,
  ];

  return [...new Set(imageList.filter(Boolean))];
};

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [pinCode, setPinCode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [checkingDelivery, setCheckingDelivery] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  const backgroundStyle = {
    backgroundImage: `url(${reyasaBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
  };

  // Fetch product details.
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/manageproducts/${id}`
        );

        const productData = response.data;

        setProduct(productData);

        const productImages = getProductImages(productData);

        setImages(productImages);
        setSelectedImage(productImages[0] || "");

      } catch (err) {
        console.error("Error fetching product:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load product details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Change main image.
  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  // Quantity controls.
  const increaseQuantity = () => {
    if (product?.stock != null && quantity >= product.stock) {
      alert("You cannot add more than the available stock.");
      return;
    }

    setQuantity((previous) => previous + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((previous) => Math.max(1, previous - 1));
  };

  // Check delivery PIN code.
  const checkDelivery = async () => {
    if (!/^[0-9]{6}$/.test(pinCode)) {
      setDeliveryMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    try {
      setCheckingDelivery(true);
      setDeliveryMessage("");

      const response = await axios.post(
        `${API_URL}/delivery/check`,
        { pinCode },
        getAuthConfig()
      );

      setDeliveryMessage(
        response.data?.message || "Delivery is available for this PIN code."
      );

    } catch (err) {
      console.error("Delivery check error:", err);

      setDeliveryMessage(
        err.response?.data?.message ||
          "Delivery is not available for this PIN code."
      );
    } finally {
      setCheckingDelivery(false);
    }
  };

  // Validate before cart or purchase.
  const validateProductSelection = () => {
    if (!localStorage.getItem("token")) {
      alert("Please login to continue.");
      navigate("/login");
      return false;
    }

    if (!selectedSize) {
      alert("Please select a size.");
      return false;
    }

    if (product?.stock != null && product.stock <= 0) {
      alert("This product is currently out of stock.");
      return false;
    }

    if (product?.stock != null && quantity > product.stock) {
      alert("Selected quantity is greater than available stock.");
      return false;
    }

    return true;
  };

  // Add product to cart.
  const handleAddToCart = async () => {
    if (!validateProductSelection()) {
      return;
    }

    try {
      setAddingToCart(true);

      const cartData = {
        productId: product.id,
        size: selectedSize,
        quantity,
      };

      await axios.post(
        `${API_URL}/cart/add`,
        cartData,
        getAuthConfig()
      );

      alert("Product added to cart successfully!");
      navigate("/cart");

    } catch (err) {
      console.error("Add to cart error:", err);

      alert(
        err.response?.data?.message ||
          "Unable to add product to cart. Please try again."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  // Buy Now.
  const handleBuyNow = async () => {
    if (!validateProductSelection()) {
      return;
    }

    try {
      setAddingToCart(true);

      const cartData = {
        productId: product.id,
        size: selectedSize,
        quantity,
      };

      await axios.post(
        `${API_URL}/cart/add`,
        cartData,
        getAuthConfig()
      );

      navigate("/cart");

    } catch (err) {
      console.error("Buy now error:", err);

      alert(
        err.response?.data?.message ||
          "Unable to proceed. Please try again."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  // Loading screen.
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={backgroundStyle}
      >
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error screen.
  if (error || !product) {
    return (
      <div
        className="container-fluid py-5"
        style={backgroundStyle}
      >
        <div className="container">
          <div className="alert alert-danger text-center">
            {error || "Product not found."}
          </div>

          <div className="text-center">
            <button
              className="btn btn-dark"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const price = Number(product.price || 0);
  const originalPrice = Number(product.originalPrice || 0);

  return (
    <div className="container-fluid py-4" style={backgroundStyle}>
      <div className="container">

        {/* Back Button */}
        <button
          className="btn btn-outline-dark mb-4"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </button>

        <div className="row g-4">

          {/* PRODUCT IMAGE GALLERY */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-3 p-3">
              <div className="row g-3">

                {/* THUMBNAILS */}
                <div className="col-12 col-lg-2 order-2 order-lg-1">
                  <div className="d-flex flex-row flex-lg-column gap-2 overflow-auto">
                    {images.length > 0 ? (
                      images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => handleImageSelect(image)}
                          className={`btn p-1 flex-shrink-0 ${
                            selectedImage === image
                              ? "border border-dark border-2"
                              : "border"
                          }`}
                          aria-label={`View product image ${index + 1}`}
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`${product.name} ${index + 1}`}
                            className="img-fluid rounded"
                            style={{
                              width: "75px",
                              height: "90px",
                              objectFit: "cover",
                            }}
                            onError={(event) => {
                              console.error(
                                "Thumbnail image failed:",
                                event.currentTarget.src
                              );
                              event.currentTarget.style.opacity = "0.3";
                            }}
                          />
                        </button>
                      ))
                    ) : (
                      <p className="text-muted small">
                        No images available.
                      </p>
                    )}
                  </div>
                </div>

                {/* MAIN IMAGE */}
                <div className="col-12 col-lg-10 order-1 order-lg-2">
                  <div
                    className="bg-light rounded-3 d-flex justify-content-center align-items-center"
                    style={{ minHeight: "450px" }}
                  >
                    {selectedImage ? (
                      <img
                        src={getImageUrl(selectedImage)}
                        alt={product.name}
                        className="img-fluid rounded-3"
                        style={{
                          width: "100%",
                          height: "550px",
                          objectFit: "contain",
                        }}
                        onError={(event) => {
                          console.error(
                            "Main product image failed:",
                            event.currentTarget.src
                          );
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted">
                        <i className="bi bi-image fs-1"></i>
                        <p className="mb-0 mt-2">
                          Product image not available
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-3 p-4 h-100">

              {/* Product Name */}
              <h2 className="fw-bold mb-2">
                {product.name}
              </h2>

              {/* Category */}
              {product.category && (
                <p className="text-muted mb-3">
                  {product.category}
                </p>
              )}

              {/* Price */}
              <div className="d-flex align-items-center gap-3 mb-3">
                <h3 className="fw-bold mb-0">
                  ₹{price.toLocaleString("en-IN")}
                </h3>

                {originalPrice > price && (
                  <>
                    <del className="text-muted">
                      ₹{originalPrice.toLocaleString("en-IN")}
                    </del>

                    <span className="badge bg-success">
                      {Math.round(
                        ((originalPrice - price) / originalPrice) * 100
                      )}
                      % OFF
                    </span>
                  </>
                )}
              </div>

              {/* Stock */}
              <p className="mb-3">
                <strong>Availability: </strong>

                {product.stock > 0 ? (
                  <span className="text-success">
                    In Stock ({product.stock})
                  </span>
                ) : (
                  <span className="text-danger">
                    Out of Stock
                  </span>
                )}
              </p>

              {/* Description */}
              <div className="mb-4">
                <h5 className="fw-bold">Product Information</h5>

                <p className="text-muted mb-0">
                  {product.description ||
                    "Discover the REYASA collection, created with passion and designed for everyday comfort."}
                </p>
              </div>

              {/* Select Size */}
              <div className="mb-4">
                <h5 className="fw-bold mb-3">
                  Select Size
                </h5>

                <div className="d-flex flex-wrap gap-2">
                  {(
                    Array.isArray(product.sizes) && product.sizes.length > 0
                      ? product.sizes
                      : ["S", "M", "L", "XL", "XXL"]
                  ).map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`btn ${
                        selectedSize === size
                          ? "btn-dark"
                          : "btn-outline-dark"
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <h5 className="fw-bold mb-3">
                  Quantity
                </h5>

                <div className="input-group" style={{ maxWidth: "150px" }}>
                  <button
                    className="btn btn-outline-dark"
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>

                  <input
                    type="text"
                    className="form-control text-center"
                    value={quantity}
                    readOnly
                  />

                  <button
                    className="btn btn-outline-dark"
                    type="button"
                    onClick={increaseQuantity}
                    disabled={
                      product.stock != null &&
                      quantity >= product.stock
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Delivery PIN Code */}
              <div className="mb-4">
                <h5 className="fw-bold mb-3">
                  Check Delivery Availability
                </h5>

                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter 6-digit PIN code"
                    value={pinCode}
                    maxLength={6}
                    onChange={(event) => {
                      setPinCode(
                        event.target.value.replace(/\D/g, "")
                      );
                      setDeliveryMessage("");
                    }}
                  />

                  <button
                    className="btn btn-outline-dark"
                    type="button"
                    onClick={checkDelivery}
                    disabled={checkingDelivery}
                  >
                    {checkingDelivery ? "Checking..." : "Check"}
                  </button>
                </div>

                {deliveryMessage && (
                  <p className="small mt-2 mb-0">
                    {deliveryMessage}
                  </p>
                )}
              </div>

              {/* Cart and Buy Buttons */}
              <div className="d-grid gap-2 mt-auto">
                <button
                  className="btn btn-dark btn-lg"
                  onClick={handleAddToCart}
                  disabled={
                    addingToCart ||
                    product.stock === 0
                  }
                >
                  {addingToCart
                    ? "Please wait..."
                    : "Add to Cart"}
                </button>

                <button
                  className="btn btn-outline-dark btn-lg"
                  onClick={handleBuyNow}
                  disabled={
                    addingToCart ||
                    product.stock === 0
                  }
                >
                  Buy Now
                </button>
              </div>

              {/* REYASA Tagline */}
              <p className="text-center text-muted small mt-4 mb-0">
                Created with passion. Worn with love.
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductDetails;