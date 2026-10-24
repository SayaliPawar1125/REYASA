
import axios from "axios";

const API_URL = "http://localhost:8080/api/manageproducts";
const UPLOAD_URL = "http://localhost:8080/api/uploads";

// Common authorization configuration
const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Get all products for admin
const getAllProductsForAdmin = () =>
  axios.get(`${API_URL}/admin/all`, getConfig());

// Get all active products
const getAllActiveProducts = () =>
  axios.get(API_URL);

// Get trending products for Home page
const getTrendingProducts = () =>
  axios.get(`${API_URL}/trending`);

// Add a new product
const addProduct = (product) =>
  axios.post(API_URL, product, getConfig());

// Update an existing product
const updateProduct = (id, product) =>
  axios.put(`${API_URL}/${id}`, product, getConfig());

// Activate a product
const activateProduct = (id) =>
  axios.patch(`${API_URL}/${id}/activate`, {}, getConfig());

// Deactivate a product
const deactivateProduct = (id) =>
  axios.patch(`${API_URL}/${id}/deactivate`, {}, getConfig());

// Update product stock
const updateStock = (id, stockQuantity) =>
  axios.patch(
    `${API_URL}/${id}/stock`,
    { stockQuantity },
    getConfig()
  );

// Update trending status
const updateTrendingStatus = (id, trending) =>
  axios.patch(
    `${API_URL}/${id}/trending`,
    { trending },
    getConfig()
  );

  // Get one active product by ID
const getProductById = (id) =>
  axios.get(`${API_URL}/${id}`);



// Upload product image
const uploadImage = (file) => {
  const data = new FormData();
  data.append("file", file);

  return axios.post(
    `${UPLOAD_URL}/image`,
    data,
    getConfig()
  );
};

// Export all product services
const ManageProductServices = {
  getAllProductsForAdmin,
  getAllActiveProducts,
  getTrendingProducts,
  getProductById,
  addProduct,
  updateProduct,
  activateProduct,
  deactivateProduct,
  updateStock,
  updateTrendingStatus,
  uploadImage,
};

export default ManageProductServices;