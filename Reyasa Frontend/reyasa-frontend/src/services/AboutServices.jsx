import axios from "axios";

const API_URL = "http://localhost:8080/api/about";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
};

const AboutServices = {
  getAboutUs: () => {
    return axios.get(API_URL);
  },

  updateAboutUs: (aboutData) => {
    return axios.put(
      `${API_URL}/admin`,
      aboutData,
      getAuthConfig()
    );
  },
};

export default AboutServices;