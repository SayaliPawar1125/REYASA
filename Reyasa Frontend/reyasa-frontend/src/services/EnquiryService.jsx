
import axios from "axios";

const API_URL = "http://localhost:8080/api/enquiries";

// Add JWT token when available
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

const EnquiryServices = {
  // Customer: Submit enquiry
  submitEnquiry: (formData) => {
    return axios.post(API_URL, formData, getAuthConfig());
  },

  // Admin: Get all enquiries
  getAllEnquiries: () => {
    return axios.get(`${API_URL}/admin/all`, getAuthConfig());
  },

  // Admin: Filter enquiries by status
  getEnquiriesByStatus: (status) => {
    return axios.get(`${API_URL}/admin/status`, {
      ...getAuthConfig(),
      params: status ? { status } : {},
    });
  },

  // Admin: Get enquiry by ID
  getEnquiryById: (id) => {
    return axios.get(`${API_URL}/admin/${id}`, getAuthConfig());
  },

  // Admin: Save or update a reply
  replyToEnquiry: (id, reply) => {
    return axios.put(
      `${API_URL}/admin/${id}/reply`,
      { reply },
      getAuthConfig()
    );
  },
};

export default EnquiryServices;
