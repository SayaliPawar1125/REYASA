import axios from "axios";

const API_URL = "http://localhost:8080/api/wishlist";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const WishlistService = {

  // GET ALL WISHLIST PRODUCTS
  getWishlist: () => {
    return axios.get(API_URL, getAuthConfig());
  },

  // GET WISHLIST COUNT
  getWishlistCount: () => {
    return axios.get(`${API_URL}/count`, getAuthConfig());
  },

  // ADD PRODUCT TO WISHLIST
  addToWishlist: (productId) => {
    return axios.post(
      `${API_URL}/${productId}`,
      {},
      getAuthConfig()
    );
  },

  // REMOVE PRODUCT FROM WISHLIST
  removeFromWishlist: (productId) => {
    return axios.delete(
      `${API_URL}/${productId}`,
      getAuthConfig()
    );
  },

};

export default WishlistService;