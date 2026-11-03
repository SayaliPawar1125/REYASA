
import React, { useEffect, useState } from "react";
import ManageProductServices from "../services/ManageProductServices";
import reyasaBackground from "../assets/reyasa-background.png";

const MAROON = "#800000";

const INITIAL_FORM = {
  name: "",
  category: "Classic",
  price: "",
  description: "",
  availableSizes: [],
  stockQuantity: 0,
  active: true,
  trending: false,
};

const SIZES = ["S", "M", "L", "XL", "XXL"];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ ...INITIAL_FORM });

  const [editingProductId, setEditingProductId] = useState(null);

  // Newly selected image files
  const [selectedImages, setSelectedImages] = useState([]);

  // Existing image filenames while editing
  const [existingImages, setExistingImages] = useState([]);

  // Primary image index
  const [primaryImage, setPrimaryImage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [updatingTrendingId, setUpdatingTrendingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Automatically hide success notification after 3 seconds.
  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => {
      setNotice("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [notice]);

  // Load products when component mounts.
  useEffect(() => {
    loadProducts();
  }, []);

  // --------------------------------------------------
  // LOAD PRODUCTS
  // --------------------------------------------------

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await ManageProductServices.getAllProductsForAdmin();

      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(
        "Load products error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.status === 401 || err.response?.status === 403
          ? "You are not authorized. Please log in using an admin account."
          : "Unable to load products. Check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FORM INPUT CHANGE
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // SIZE SELECTION
  // --------------------------------------------------

  const handleSizeChange = (size) => {
    setForm((previous) => ({
      ...previous,

      availableSizes: previous.availableSizes.includes(size)
        ? previous.availableSizes.filter((item) => item !== size)
        : [...previous.availableSizes, size],
    }));
  };

  // --------------------------------------------------
  // IMAGE URL
  // --------------------------------------------------

  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";

    if (/^https?:\/\//i.test(imageKey)) {
      return imageKey;
    }

    const fileName = imageKey
      .replace(/^\/+/, "")
      .replace(/^uploads\//i, "");

    return `http://localhost:8080/uploads/${fileName
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  };

  // --------------------------------------------------
  // SELECT MULTIPLE IMAGES
  // --------------------------------------------------

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const validFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not a valid image.`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        alert(`${file.name} exceeds the 5 MB size limit.`);
        continue;
      }

      validFiles.push(file);
    }

    const totalImages =
      existingImages.length + selectedImages.length + validFiles.length;

    if (totalImages > MAX_IMAGES) {
      alert(`You can upload a maximum of ${MAX_IMAGES} images per product.`);
      event.target.value = "";
      return;
    }

    setSelectedImages((previous) => [
      ...previous,
      ...validFiles,
    ]);

    event.target.value = "";
  };

  // --------------------------------------------------
  // REMOVE NEWLY SELECTED IMAGE
  // --------------------------------------------------

  const removeSelectedImage = (index) => {
    setSelectedImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );

    setPrimaryImage(0);
  };

  // --------------------------------------------------
  // REMOVE EXISTING IMAGE
  // --------------------------------------------------

  const removeExistingImage = (index) => {
    setExistingImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );

    setPrimaryImage(0);
  };

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });

    setEditingProductId(null);
    setSelectedImages([]);
    setExistingImages([]);
    setPrimaryImage(0);

    const fileInput = document.getElementById("productImages");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // --------------------------------------------------
  // EDIT PRODUCT
  // --------------------------------------------------

  const handleEdit = (product) => {
    setEditingProductId(product.id);

    const productImages =
      Array.isArray(product.imageKeys) && product.imageKeys.length > 0
        ? product.imageKeys
        : product.imageKey
          ? [product.imageKey]
          : [];

    setExistingImages(productImages);
    setSelectedImages([]);
    setPrimaryImage(0);

    setForm({
      name: product.name || "",
      category: product.category || "Classic",
      price: product.price ?? "",
      description: product.description || "",

      availableSizes: (product.availableSizes || "")
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean),

      stockQuantity: product.stockQuantity ?? 0,
      active: Boolean(product.active),
      trending: Boolean(product.trending),
    });

    setNotice("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // --------------------------------------------------
  // GET IMAGE KEY FROM UPLOAD RESPONSE
  // --------------------------------------------------

  const extractImageKey = (uploadResponse) => {
    const data = uploadResponse?.data;

    if (typeof data === "string") {
      return data;
    }

    return (
      data?.imageKey ||
      data?.filename ||
      data?.fileName ||
      data?.name ||
      ""
    );
  };

  // --------------------------------------------------
  // SAVE PRODUCT
  // --------------------------------------------------

  const handleSaveProduct = async (event) => {
    event.preventDefault();

    setNotice("");
    setError("");

    if (
      !form.name.trim() ||
      !form.category ||
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      alert("Enter a product name, category, and valid price.");
      return;
    }

    if (
      form.stockQuantity === "" ||
      !Number.isInteger(Number(form.stockQuantity)) ||
      Number(form.stockQuantity) < 0
    ) {
      alert("Stock quantity must be a non-negative whole number.");
      return;
    }

    if (form.availableSizes.length === 0) {
      alert("Please select at least one available size.");
      return;
    }

    if (existingImages.length + selectedImages.length === 0) {
      alert("Please select at least one product image.");
      return;
    }

    try {
      setSaving(true);

      // Keep existing images.
      let imageKeys = [...existingImages];

      // Upload newly selected images one by one.
      for (const file of selectedImages) {
        const uploadResponse =
          await ManageProductServices.uploadImage(file);

        const imageKey = extractImageKey(uploadResponse);

        if (!imageKey) {
          throw new Error(
            `Unable to get the uploaded filename for ${file.name}.`
          );
        }

        imageKeys.push(imageKey);
      }

      // Set selected image as primary image.
      const selectedPrimaryImage =
        imageKeys[primaryImage] || imageKeys[0];

      const productData = {
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        description: form.description.trim(),

        imageKey: selectedPrimaryImage,
        imageKeys: imageKeys,

        availableSizes: form.availableSizes.join(","),

        stockQuantity: Number(form.stockQuantity),

        active: Boolean(form.active),
        trending: Boolean(form.trending),
      };

      if (editingProductId !== null) {
        await ManageProductServices.updateProduct(
          editingProductId,
          productData
        );

        setNotice("Product updated successfully!");
      } else {
        await ManageProductServices.addProduct(productData);

        setNotice("Product added successfully!");
      }

      resetForm();

      await loadProducts();
    } catch (err) {
      console.error(
        "Save product error:",
        err.response?.data || err.message
      );

      const responseData = err.response?.data;

      const message =
        typeof responseData === "string"
          ? responseData
          : responseData?.message ||
            responseData?.detail ||
            responseData?.error ||
            err.message ||
            "Unable to save product. Check the backend console.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // TRENDING PRODUCT
  // --------------------------------------------------

  const handleTrendingChange = async (product) => {
    const nextTrending = !Boolean(product.trending);

    try {
      setUpdatingTrendingId(product.id);

      setError("");
      setNotice("");

      await ManageProductServices.updateTrendingStatus(
        product.id,
        nextTrending
      );

      setProducts((previous) =>
        previous.map((item) =>
          item.id === product.id
            ? { ...item, trending: nextTrending }
            : item
        )
      );

      setNotice(
        nextTrending
          ? `${product.name} added to Trending Products.`
          : `${product.name} removed from Trending Products.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.status === 401 || err.response?.status === 403
          ? "You are not authorized to change trending products."
          : "Unable to update trending status."
      );
    } finally {
      setUpdatingTrendingId(null);
    }
  };

  // --------------------------------------------------
  // DEACTIVATE PRODUCT
  // --------------------------------------------------

  const handleDeactivate = async (product) => {
    if (!window.confirm(`Deactivate "${product.name}"?`)) return;

    try {
      await ManageProductServices.deactivateProduct(product.id);

      await loadProducts();

      setNotice("Product deactivated successfully.");
    } catch (err) {
      console.error(err);
      setError("Unable to deactivate product.");
    }
  };

  // --------------------------------------------------
  // ACTIVATE PRODUCT
  // --------------------------------------------------

  const handleActivate = async (product) => {
    try {
      await ManageProductServices.activateProduct(product.id);

      await loadProducts();

      setNotice("Product activated successfully.");
    } catch (err) {
      console.error(err);
      setError("Unable to activate product.");
    }
  };

  // --------------------------------------------------
  // UPDATE STOCK
  // --------------------------------------------------

  const handleStockUpdate = async (product) => {
    const enteredStock = window.prompt(
      `Enter new stock quantity for ${product.name}:`,
      String(product.stockQuantity ?? 0)
    );

    if (enteredStock === null) return;

    const stockQuantity = Number(enteredStock);

    if (
      enteredStock.trim() === "" ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      alert("Enter a valid non-negative whole number.");
      return;
    }

    try {
      await ManageProductServices.updateStock(
        product.id,
        stockQuantity
      );

      await loadProducts();

      setNotice("Stock quantity updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Unable to update stock quantity.");
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div
      className="min-vh-100"
      style={{
        backgroundImage: `url(${reyasaBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        paddingTop: "110px",
        paddingBottom: "32px",
      }}
    >
      {/* SUCCESS POPUP */}

      {notice && (
        <div
          className="reyasa-cart-notification"
          role="status"
          aria-live="polite"
        >
          <i
            className="bi bi-check-circle-fill"
            aria-hidden="true"
          ></i>

          <p className="reyasa-cart-notification-message">
            {notice}
          </p>
        </div>
      )}

      <div className="container">

        {/* ERROR MESSAGE */}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* PAGE HEADING AND REFRESH BUTTON */}

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">

          <div>
            <h2 className="fw-bold mb-2" style={{ color: MAROON }}>
              <i className="bi bi-box-seam me-2"></i>
              Manage Products
            </h2>

            <p className="mb-0" style={{ color: MAROON }}>
              Add and manage your REYASA collection.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-dark"
            onClick={loadProducts}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            {loading ? "Refreshing..." : "Refresh Products"}
          </button>

        </div>

        {/* PRODUCT FORM */}

        <div className="card shadow-sm border-0 mb-5">

          <div className="card-header bg-dark text-white py-3">

            <h5 className="mb-0">
              {editingProductId !== null
                ? "Edit Product"
                : "Add New Product"}
            </h5>

          </div>

          <div className="card-body p-3 p-md-4">

            <form onSubmit={handleSaveProduct}>

              <div className="row g-3">

                {/* PRODUCT NAME */}

                <div className="col-12 col-md-6">

                  <label htmlFor="name" className="form-label">
                    Product Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* CATEGORY */}

                <div className="col-12 col-md-6">

                  <label htmlFor="category" className="form-label">
                    Category
                  </label>

                  <select
                    id="category"
                    name="category"
                    className="form-select"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="Classic">Classic</option>
                    <option value="Premium">Premium</option>
                  </select>

                </div>

                {/* PRICE */}

                <div className="col-12 col-md-6">

                  <label htmlFor="price" className="form-label">
                    Price (₹)
                  </label>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* STOCK */}

                <div className="col-12 col-md-6">

                  <label htmlFor="stockQuantity" className="form-label">
                    Stock Quantity
                  </label>

                  <input
                    id="stockQuantity"
                    name="stockQuantity"
                    type="number"
                    min="0"
                    step="1"
                    className="form-control"
                    value={form.stockQuantity}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* DESCRIPTION */}

                <div className="col-12">

                  <label htmlFor="description" className="form-label">
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    className="form-control"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter product description"
                  />

                </div>

                {/* AVAILABLE SIZES */}

                <div className="col-12">

                  <label className="form-label d-block">
                    Available Sizes
                  </label>

                  <div className="d-flex flex-wrap gap-3">

                    {SIZES.map((size) => (

                      <div className="form-check" key={size}>

                        <input
                          id={`size-${size}`}
                          type="checkbox"
                          className="form-check-input"
                          checked={form.availableSizes.includes(size)}
                          onChange={() => handleSizeChange(size)}
                        />

                        <label
                          className="form-check-label"
                          htmlFor={`size-${size}`}
                        >
                          {size}
                        </label>

                      </div>

                    ))}

                  </div>

                </div>

                {/* MULTIPLE PRODUCT IMAGES */}

                <div className="col-12">

                  <label
                    htmlFor="productImages"
                    className="form-label fw-semibold"
                  >
                    Product Images
                  </label>

                  <input
                    id="productImages"
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageChange}
                    disabled={
                      existingImages.length + selectedImages.length >=
                      MAX_IMAGES
                    }
                  />

                  <div className="form-text">
                    Upload up to {MAX_IMAGES} images.
                    JPG, PNG, or WebP. Maximum 5 MB per image.
                  </div>

                </div>

                {/* EXISTING IMAGE PREVIEWS */}

                {existingImages.length > 0 && (

                  <div className="col-12">

                    <label className="form-label fw-semibold">
                      Existing Images
                    </label>

                    <div className="row g-3">

                      {existingImages.map((imageKey, index) => (

                        <div
                          className="col-6 col-sm-4 col-md-3 col-lg-2"
                          key={`${imageKey}-${index}`}
                        >

                          <div className="card h-100">

                            <img
                              src={getImageUrl(imageKey)}
                              alt={`Existing product ${index + 1}`}
                              className="card-img-top img-thumbnail"
                            />

                            <div className="card-body p-2">

                              <button
                                type="button"
                                className={`btn btn-sm w-100 mb-2 ${
                                  primaryImage === index
                                    ? "btn-dark"
                                    : "btn-outline-dark"
                                }`}
                                onClick={() => setPrimaryImage(index)}
                              >
                                {primaryImage === index
                                  ? "Primary Image"
                                  : "Set Primary"}
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger w-100"
                                onClick={() => removeExistingImage(index)}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Remove
                              </button>

                            </div>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                )}

                {/* NEW IMAGE PREVIEWS */}

                {selectedImages.length > 0 && (

                  <div className="col-12">

                    <label className="form-label fw-semibold">
                      Newly Selected Images
                    </label>

                    <div className="row g-3">

                      {selectedImages.map((file, index) => (

                        <div
                          className="col-6 col-sm-4 col-md-3 col-lg-2"
                          key={`${file.name}-${index}`}
                        >

                          <div className="card h-100">

                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="card-img-top img-thumbnail"
                            />

                            <div className="card-body p-2">

                              <p className="small text-truncate mb-2">
                                {file.name}
                              </p>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger w-100"
                                onClick={() => removeSelectedImage(index)}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Remove
                              </button>

                            </div>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                )}

                {/* ACTIVE PRODUCT */}

                <div className="col-12">

                  <div className="form-check">

                    <input
                      id="active"
                      type="checkbox"
                      className="form-check-input"
                      checked={form.active}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          active: event.target.checked,
                        }))
                      }
                    />

                    <label className="form-check-label" htmlFor="active">
                      Active Product
                    </label>

                  </div>

                </div>

                {/* TRENDING PRODUCT */}

                <div className="col-12">

                  <div className="border rounded p-3 bg-light">

                    <div className="form-check">

                      <input
                        id="trending"
                        type="checkbox"
                        className="form-check-input"
                        checked={form.trending}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            trending: event.target.checked,
                          }))
                        }
                      />

                      <label
                        className="form-check-label fw-semibold"
                        htmlFor="trending"
                      >
                        <i className="bi bi-fire me-2 text-danger"></i>
                        Show in Home Page Trending Products
                      </label>

                    </div>

                    <small className="text-muted d-block mt-1">
                      When enabled, this product can appear in the Home
                      page Trending section, provided it is active.
                    </small>

                  </div>

                </div>

                {/* IMAGE COUNT */}

                <div className="col-12">

                  <div className="alert alert-info mb-0">
                    Total images:{" "}
                    {existingImages.length + selectedImages.length}
                    /{MAX_IMAGES}
                  </div>

                </div>

                {/* FORM BUTTONS */}

                <div className="col-12 d-flex flex-wrap gap-2 mt-4">

                  <button
                    type="submit"
                    className="btn btn-dark px-4"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : editingProductId !== null ? (
                      "Update Product"
                    ) : (
                      "Add Product"
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Clear Form
                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

        {/* PRODUCTS TABLE */}

        <div className="card shadow-sm border-0">

          <div className="card-header bg-dark text-white py-3">

            <h5 className="mb-0">
              All Products ({products.length})
            </h5>

          </div>

          <div className="card-body p-0">

            {loading ? (

              <div className="text-center py-5">

                <div className="spinner-border" role="status">
                  <span className="visually-hidden">
                    Loading...
                  </span>
                </div>

                <p className="mt-2 mb-0">
                  Loading products...
                </p>

              </div>

            ) : products.length === 0 ? (

              <p className="text-center py-5 mb-0">
                No products found.
              </p>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>
                      <th>ID</th>
                      <th>Image</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Sizes</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Trending</th>
                      <th>Actions</th>
                    </tr>

                  </thead>

                  <tbody>

                    {[...products]
                      .sort((a, b) => Number(b.id) - Number(a.id))
                      .map((product) => (

                        <tr key={product.id}>

                          <td>{product.id}</td>

                          {/* PRIMARY IMAGE */}

                          <td>

                            {product.imageKey ? (

                              <img
                                src={getImageUrl(product.imageKey)}
                                alt={product.name}
                                width="65"
                                height="75"
                                className="rounded img-thumbnail"
                                onError={(event) => {
                                  event.currentTarget.classList.add("d-none");
                                }}
                              />

                            ) : (

                              <span className="text-muted">
                                No image
                              </span>

                            )}

                            {Array.isArray(product.imageKeys) &&
                              product.imageKeys.length > 1 && (

                                <span className="badge text-bg-info ms-1">
                                  +{product.imageKeys.length - 1}
                                </span>

                              )}

                          </td>

                          <td>
                            <span className="fw-semibold">
                              {product.name}
                            </span>
                          </td>

                          <td>{product.category}</td>

                          <td>
                            ₹{Number(product.price).toLocaleString("en-IN")}
                          </td>

                          <td>
                            {product.availableSizes || "-"}
                          </td>

                          <td>
                            {product.stockQuantity ?? 0}
                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={`badge ${
                                product.active
                                  ? "text-bg-success"
                                  : "text-bg-secondary"
                              }`}
                            >
                              {product.active ? "Active" : "Inactive"}
                            </span>

                          </td>

                          {/* TRENDING */}

                          <td>

                            <div className="form-check form-switch">

                              <input
                                id={`trending-${product.id}`}
                                type="checkbox"
                                role="switch"
                                className="form-check-input"
                                checked={Boolean(product.trending)}
                                disabled={
                                  updatingTrendingId === product.id
                                }
                                onChange={() =>
                                  handleTrendingChange(product)
                                }
                                aria-label={`Toggle trending for ${product.name}`}
                              />

                              <label
                                htmlFor={`trending-${product.id}`}
                                className="form-check-label small"
                              >
                                {updatingTrendingId === product.id
                                  ? "Saving..."
                                  : product.trending
                                    ? "Trending"
                                    : "Off"}
                              </label>

                            </div>

                          </td>

                          {/* ACTIONS */}

                          <td>

                            <div className="d-flex flex-wrap gap-2">

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark"
                                onClick={() => handleEdit(product)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleStockUpdate(product)}
                              >
                                Stock
                              </button>

                              {product.active ? (

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeactivate(product)}
                                >
                                  Deactivate
                                </button>

                              ) : (

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => handleActivate(product)}
                                >
                                  Activate
                                </button>

                              )}

                            </div>

                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default ManageProducts;
