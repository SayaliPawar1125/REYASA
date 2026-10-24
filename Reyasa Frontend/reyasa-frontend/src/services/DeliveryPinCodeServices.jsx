
const API_URL =
  "http://localhost:8080/api/warehouse/delivery-pins/admin";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const handleResponse = async (response) => {
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      // The server may return an empty or non-JSON response.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return null;
};

const DeliveryPinCodeServices = {
  // Get all delivery PIN codes
  getDeliveryPinCodes: async () => {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: getHeaders(),
    });

    return handleResponse(response);
  },

  // Add a new delivery PIN code
  addDeliveryPinCode: async (pinCode) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ pinCode }),
    });

    return handleResponse(response);
  },

  // Enable or disable a delivery PIN code
  updateDeliveryPinCodeStatus: async (id, active) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ active }),
    });

    return handleResponse(response);
  },

  // Delete a delivery PIN code
  deleteDeliveryPinCode: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    return handleResponse(response);
  },
};

export default DeliveryPinCodeServices;
