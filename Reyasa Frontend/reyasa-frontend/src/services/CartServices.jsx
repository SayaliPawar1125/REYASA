
import axios from "axios";

const CART_API_URL = "http://localhost:8080/api/cart";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  };
};

// Add a shirt to the cart
const addToCart = (productId, userId, size, quantity = 1) => {
  return axios.post(
    `${CART_API_URL}/add`,
    {
      productId: Number(productId),
      userId: Number(userId),
      size,
      quantity,
    },
    getAuthConfig()
  );
};

// Get all items for the logged-in user
const getCartItems = (userId) => {
  return axios.get(
    `${CART_API_URL}/user/${userId}`,
    getAuthConfig()
  );
};

// Update item quantity
const updateQuantity = (cartItemId, userId, quantity) => {
  return axios.put(
    `${CART_API_URL}/update/${cartItemId}?userId=${userId}`,
    { quantity },
    getAuthConfig()
  );
};

// Remove an item from the cart
const removeCartItem = (cartItemId, userId) => {
  return axios.delete(
    `${CART_API_URL}/remove/${cartItemId}?userId=${userId}`,
    getAuthConfig()
  );
};

// Clear the entire cart
const clearCart = (userId) => {
  return axios.delete(
    `${CART_API_URL}/clear?userId=${userId}`,
    getAuthConfig()
  );
};

const CartServices = {
  addToCart,
  getCartItems,
  updateQuantity,
  removeCartItem,
  clearCart,
};

export default CartServices;
