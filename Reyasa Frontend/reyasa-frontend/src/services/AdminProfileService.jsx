import axios from "axios";

const API_URL = "http://localhost:8080/api/admin/profile";

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

const getProfile = () => {
  return axios.get(API_URL, getAuthHeaders());
};

const updateProfile = (data) => {
  return axios.put(API_URL, data, getAuthHeaders());
};

const changePassword = (data) => {
  return axios.put(
    `${API_URL}/change-password`,
    data,
    getAuthHeaders()
  );
};

const AdminProfileService = {
  getProfile,
  updateProfile,
  changePassword,
};

export default AdminProfileService;