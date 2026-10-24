
import api from "../api/api";

const UserService = {
  getCurrentUser: () => {
    return api.get("/api/users/me");
  },
};

export default UserService;
