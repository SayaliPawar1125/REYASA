import axios from "axios";

const API_URL = "http://localhost:8080/api/manageproducts";
const UPLOAD_URL = "http://localhost:8080/api/uploads";

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// ADMIN PRODUCTS

const getAllProductsForAdmin = () =>
  axios.get(`${API_URL}/admin/all`, getConfig());

// ACTIVE PRODUCTS

const getAllActiveProducts = () =>
  axios.get(API_URL);

// TRENDING PRODUCTS

const getTrendingProducts = () =>
  axios.get(`${API_URL}/trending`);

// PRODUCT BY ID

const getProductById = (id) =>
  axios.get(`${API_URL}/${id}`);

// ADD PRODUCT

const addProduct = (product) =>
  axios.post(API_URL, product, getConfig());

// UPDATE PRODUCT

const updateProduct = (id, product) =>
  axios.put(`${API_URL}/${id}`, product, getConfig());

// ACTIVATE PRODUCT

const activateProduct = (id) =>
  axios.patch(`${API_URL}/${id}/activate`, {}, getConfig());

// DEACTIVATE PRODUCT

const deactivateProduct = (id) =>
  axios.patch(`${API_URL}/${id}/deactivate`, {}, getConfig());

// UPDATE STOCK

const updateStock = (id, stockQuantity) =>
  axios.patch(
    `${API_URL}/${id}/stock`,
    { stockQuantity },
    getConfig()
  );

// UPDATE TRENDING STATUS

const updateTrendingStatus = (id, trending) =>
  axios.patch(
    `${API_URL}/${id}/trending`,
    { trending },
    getConfig()
  );

// UPLOAD ONE IMAGE

const uploadImage = (file) => {
  const formData = new FormData();

  formData.append("file", file);

  return axios.post(
    `${UPLOAD_URL}/image`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
};

// EXTRACT IMAGE KEY

const extractImageKey = (response) => {
  const data = response?.data;

  if (typeof data === "string") {
    return data;
  }

  return (
    data?.imageKey ||
    data?.filename ||
    data?.fileName ||
    data?.name ||
    null
  );
};

// UPLOAD MULTIPLE IMAGES

const uploadMultipleImages = async (files) => {
  const uploadedImages = [];

  for (const file of files) {

    const response = await uploadImage(file);

    const imageKey = extractImageKey(response);

    if (!imageKey) {
      throw new Error(
        `Image upload failed for ${file.name}`
      );
    }

    uploadedImages.push(imageKey);
  }

  return uploadedImages;
};

// EXPORT SERVICES

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
  uploadMultipleImages,
};

export default ManageProductServices;