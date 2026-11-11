
import api from "../api/api";

const AuthService = {
  register: (userData) => {
    return api.post("/api/auth/register", userData);
  },

  login: (loginData) => {
    return api.post("/api/auth/login", loginData);
  },

  // Google login
  googleLogin: (googleData) => {
    return api.post("/api/auth/google", googleData);
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("firstname");
    localStorage.removeItem("lastname");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  },
};

export default AuthService;
