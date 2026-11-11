
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

// Convert image key into complete image URL.
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

// Collect product images without duplicates.
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

// Get available product sizes.
const getProductSizes = (product) => {
  if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
    return product.sizes;
  }

  if (
    typeof product?.availableSizes === "string" &&
    product.availableSizes.trim()
  ) {
    return product.availableSizes
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean);
  }

  if (
    Array.isArray(product?.availableSizes) &&
    product.availableSizes.length > 0
  ) {
    return product.availableSizes;
  }

  return ["S", "M", "L", "XL", "XXL"];
};

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Delivery PIN states.
  const [pinCode, setPinCode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState(null);
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

        const stockValue =
          productData.stockQuantity ?? productData.stock ?? 0;

        const normalizedProduct = {
          ...productData,
          stock: Number(stockValue),
          sizes: getProductSizes(productData),
        };

        setProduct(normalizedProduct);

        const productImages = getProductImages(productData);

        setImages(productImages);
        setSelectedImage(productImages[0] || "");

        setQuantity(1);
        setSelectedSize("");

        // Reset delivery details when product changes.
        setPinCode("");
        setDeliveryMessage("");
        setDeliveryAvailable(null);

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

  // Change selected image.
  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  // Increase quantity.
  const increaseQuantity = () => {
    if (product && quantity >= product.stock) {
      alert("You cannot add more than the available stock.");
      return;
    }

    setQuantity((previous) => previous + 1);
  };

  // Decrease quantity.
  const decreaseQuantity = () => {
    setQuantity((previous) => Math.max(1, previous - 1));
  };

  // Check delivery PIN code.
  const checkDelivery = async () => {
    if (!/^[0-9]{6}$/.test(pinCode)) {
      setDeliveryMessage("Please enter a valid 6-digit PIN code.");
      setDeliveryAvailable(false);
      return;
    }

    try {
      setCheckingDelivery(true);
      setDeliveryMessage("");
      setDeliveryAvailable(null);

      const response = await axios.get(
        `${API_URL}/warehouse/delivery-pins/check`,
        {
          params: {
            pinCode: pinCode.trim(),
          },
        }
      );

      setDeliveryMessage(response.data.message);
      setDeliveryAvailable(response.data.available);

    } catch (error) {
      console.error("Delivery check error:", error);

      setDeliveryMessage(
        error.response?.data?.message ||
        "Unable to check delivery. Please try again."
      );

      setDeliveryAvailable(false);

    } finally {
      setCheckingDelivery(false);
    }
  };

  // Validate product selection.
  const validateProductSelection = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token) {
      alert("Please login to continue.");
      navigate("/login");
      return false;
    }

    if (
      !userId ||
      !Number.isInteger(Number(userId)) ||
      Number(userId) <= 0
    ) {
      alert("User ID not found. Please login again.");
      navigate("/login");
      return false;
    }

    if (!selectedSize) {
      alert("Please select a size.");
      return false;
    }

    if (!product || product.stock <= 0) {
      alert("This product is currently out of stock.");
      return false;
    }

    if (quantity > product.stock) {
      alert("Selected quantity is greater than available stock.");
      return false;
    }

    return true;
  };

  // Prepare cart request.
  const getCartData = () => {
    return {
      userId: Number(localStorage.getItem("userId")),
      productId: Number(product.id),
      size: selectedSize,
      quantity: Number(quantity),
    };
  };

  // Add to Cart.
  const handleAddToCart = async () => {
    if (!validateProductSelection()) {
      return;
    }

    try {
      setAddingToCart(true);

      const cartData = getCartData();

      console.log(
        "CART REQUEST DATA:",
        JSON.stringify(cartData, null, 2)
      );

      const response = await axios.post(
        `${API_URL}/cart/add`,
        cartData,
        getAuthConfig()
      );

      console.log("CART SUCCESS:", response.data);

      alert("Product added to cart successfully!");

      navigate("/cart");

    } catch (err) {
      console.error("CART ERROR STATUS:", err.response?.status);
      console.error("CART ERROR RESPONSE:", err.response?.data);
      console.error("CART ERROR MESSAGE:", err.message);

      alert(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to add product to cart. Please check the backend console."
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

      const cartData = getCartData();

      console.log("BUY NOW REQUEST:", cartData);

      await axios.post(
        `${API_URL}/cart/add`,
        cartData,
        getAuthConfig()
      );

      navigate("/cart");

    } catch (err) {
      console.error(
        "Buy now error:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.detail ||
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
  const stock = Number(product.stock || 0);

  return (
    <div
      className="container-fluid py-3"
      style={backgroundStyle}
    >
      <div className="container px-2 px-md-3">

        {/* BACK BUTTON */}
        <button
          className="btn btn-outline-dark btn-sm mb-3"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </button>

        {/* MAIN PRODUCT LAYOUT */}
        <div className="row g-3 g-lg-4 align-items-start">

          {/* LEFT SIDE: PRODUCT GALLERY */}
          <div className="col-12 col-md-7">
            <div className="row g-2">

              {/* VERTICAL THUMBNAILS */}
              <div className="col-2">
                <div className="d-flex flex-column gap-2">

                  {images.length > 0 ? (
                    images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => handleImageSelect(image)}
                        className={`p-1 bg-white ${
                          selectedImage === image
                            ? "border border-dark border-2"
                            : "border border-light-subtle"
                        }`}
                        style={{
                          width: "100%",
                          aspectRatio: "3 / 4",
                          overflow: "hidden",
                          cursor: "pointer",
                        }}
                        aria-label={`View product image ${index + 1}`}
                        aria-pressed={selectedImage === image}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`${product.name} view ${index + 1}`}
                          className="w-100 h-100 object-fit-cover"
                          onError={(event) => {
                            event.currentTarget.style.opacity = "0.3";
                          }}
                        />
                      </button>
                    ))
                  ) : (
                    <div className="bg-white border p-2 text-center">
                      <span className="text-muted small">
                        No images
                      </span>
                    </div>
                  )}

                </div>
              </div>

              {/* LARGE MAIN PRODUCT IMAGE */}
              <div className="col-10">
                <div className="bg-white border p-2 shadow-sm">

                  <div
                    className="position-relative w-100 overflow-hidden"
                    style={{ aspectRatio: "3 / 4" }}
                  >
                    {selectedImage ? (
                      <img
                        src={getImageUrl(selectedImage)}
                        alt={product.name}
                        className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                        <span className="text-secondary text-center">
                          Product image not available
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* RIGHT SIDE: PRODUCT DETAILS */}
          <div className="col-12 col-md-5 text-start">

            <div className="card border-0 shadow-sm rounded-0 p-3 h-100">

              {/* PRODUCT NAME */}
              <h4 className="fw-bold mb-1">
                {product.name}
              </h4>

              {/* CATEGORY */}
              {product.category && (
                <p className="text-muted small mb-2">
                  {product.category}
                </p>
              )}

              <hr className="my-2" />

              {/* PRICE */}
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">

                <h4 className="fw-bold mb-0">
                  ₹{price.toLocaleString("en-IN")}
                </h4>

                {originalPrice > price && (
                  <>
                    <del className="text-muted small">
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

              {/* STOCK */}
              <p className="small mb-3">
                <strong>Availability: </strong>

                {stock > 0 ? (
                  <span className="text-success">
                    In Stock ({stock})
                  </span>
                ) : (
                  <span className="text-danger">
                    Out of Stock
                  </span>
                )}
              </p>

              {/* DESCRIPTION */}
              <div className="mb-3">
                <h6 className="fw-bold">
                  Product Information
                </h6>

                <p className="text-muted small mb-0">
                  {product.description ||
                    "Discover the REYASA collection, created with passion and designed for everyday comfort."}
                </p>
              </div>

              <hr className="my-2" />

              {/* SELECT SIZE */}
              <div className="mb-3">
                <h6 className="fw-bold mb-2">
                  Select Size
                </h6>

                <div className="d-flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`btn btn-sm ${
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

              {/* QUANTITY */}
              <div className="mb-3">
                <h6 className="fw-bold mb-2">
                  Quantity
                </h6>

                <div
                  className="input-group input-group-sm"
                  style={{ maxWidth: "120px" }}
                >
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
                    disabled={quantity >= stock}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* DELIVERY PIN CODE */}
              <div className="mb-3">
                <h6 className="fw-bold mb-2">
                  Check Delivery Availability
                </h6>

                <div className="input-group input-group-sm">
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
                      setDeliveryAvailable(null);
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
                  <p
                    className={`small mt-2 mb-0 ${
                      deliveryAvailable === true
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {deliveryMessage}
                  </p>
                )}
              </div>

              {/* ADD TO CART AND BUY NOW */}
              <div className="d-grid gap-2 mt-2">

                <button
                  className="btn btn-dark"
                  onClick={handleAddToCart}
                  disabled={addingToCart || stock <= 0}
                >
                  {addingToCart
                    ? "Please wait..."
                    : "Add to Cart"}
                </button>

                <button
                  className="btn btn-outline-dark"
                  onClick={handleBuyNow}
                  disabled={addingToCart || stock <= 0}
                >
                  Buy Now
                </button>

              </div>

              {/* REYASA TAGLINE */}
              <p className="text-center text-muted small mt-3 mb-0">
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
