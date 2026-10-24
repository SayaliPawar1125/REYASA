
import axios from "axios";

const API_URL = "http://localhost:8080/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  };
};

const getFooter = () => {
  return axios.get(`${API_URL}/footer`);
};

const saveFooter = (footerData) => {
  return axios.put(
    `${API_URL}/admin/footer`,
    footerData,
    getAuthConfig()
  );
};

const resetFooter = () => {
  return axios.put(
    `${API_URL}/admin/footer/reset`,
    {},
    getAuthConfig()
  );
};

const FooterService = {
  getFooter,
  saveFooter,
  resetFooter,
};

export default FooterService;
