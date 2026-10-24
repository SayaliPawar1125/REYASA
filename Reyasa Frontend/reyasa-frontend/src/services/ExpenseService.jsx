
import axios from "axios";

const API_URL = "http://localhost:8080/api/admin/expenses";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
};

const ExpenseService = {
  getAll: (filters = {}) =>
    axios.get(API_URL, {
      ...getAuthConfig(),
      params: filters,
    }),

  getSummary: (filters = {}) =>
    axios.get(`${API_URL}/summary`, {
      ...getAuthConfig(),
      params: filters,
    }),

  getById: (id) =>
    axios.get(`${API_URL}/${id}`, getAuthConfig()),

  create: (data, receipt) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    if (receipt) {
      formData.append("receipt", receipt);
    }

    return axios.post(API_URL, formData, getAuthConfig());
  },

  update: (id, data, receipt) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    if (receipt) {
      formData.append("receipt", receipt);
    }

    return axios.put(`${API_URL}/${id}`, formData, getAuthConfig());
  },

  remove: (id) =>
    axios.delete(`${API_URL}/${id}`, getAuthConfig()),

  downloadReceipt: async (id) => {
    const response = await axios.get(
      `${API_URL}/${id}/receipt`,
      {
        ...getAuthConfig(),
        responseType: "blob",
      }
    );

    const blobUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = `expense-receipt-${id}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  },
};

export default ExpenseService;
