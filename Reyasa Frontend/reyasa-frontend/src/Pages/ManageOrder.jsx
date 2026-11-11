import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import reyasaBackground from "../assets/reyasa-background.png";

const API_URL = "http://localhost:8080/api/admin/orders";
const MAROON = "#800000";

const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function ManageOrders() {
  const [orders, setOrders] = useState([]);

  const [stats, setStats] = useState({
    totalOrders: 0,
    todaysOrders: 0,
    todaysRevenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);
  const [trackingId, setTrackingId] = useState(null);
  const [savingTrackingId, setSavingTrackingId] = useState(null);

  const [trackingForms, setTrackingForms] = useState({});

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    orderId: "",
    status: "",
    customerName: "",
  });

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const getCustomerName = (order) => {
    if (order.shippingName?.trim()) return order.shippingName;

    const profileName = [
      order.user?.firstName,
      order.user?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return profileName || order.user?.name || "Customer";
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount ?? 0));

  const formatDate = (date) => {
    if (!date) return "—";

    const value = new Date(date);

    return Number.isNaN(value.getTime())
      ? "—"
      : value.toLocaleString("en-IN");
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
      case "PAID":
        return "text-bg-success";

      case "CANCELLED":
      case "FAILED":
        return "text-bg-danger";

      case "SHIPPED":
        return "text-bg-primary";

      case "PROCESSING":
        return "text-bg-info";

      case "CONFIRMED":
        return "text-bg-secondary";

      default:
        return "text-bg-warning";
    }
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        fetch(API_URL, { headers: getHeaders() }),
        fetch(`${API_URL}/stats`, { headers: getHeaders() }),
      ]);

      if (!ordersResponse.ok) {
        throw new Error(
          `Unable to load orders. Server returned ${ordersResponse.status}.`
        );
      }

      const orderData = await ordersResponse.json();
      const safeOrders = Array.isArray(orderData) ? orderData : [];

      setOrders(safeOrders);

      // Fill tracking forms from the saved tracking details.
      setTrackingForms((previous) => {
        const updated = { ...previous };

        safeOrders.forEach((order) => {
          updated[order.id] = {
            courierName:
              updated[order.id]?.courierName ?? order.courierName ?? "",
            trackingNumber:
              updated[order.id]?.trackingNumber ??
              order.trackingNumber ??
              "",
            trackingUrl:
              updated[order.id]?.trackingUrl ?? order.trackingUrl ?? "",
          };
        });

        return updated;
      });

      if (statsResponse.ok) {
        const data = await statsResponse.json();

        setStats({
          totalOrders: data.totalOrders ?? 0,
          todaysOrders: data.todaysOrders ?? data.todayOrders ?? 0,
          todaysRevenue: data.todaysRevenue ?? 0,
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  const updateStatus = async (orderId, status) => {
    const previousOrder = orders.find((order) => order.id === orderId);

    if (
      previousOrder?.orderStatus?.toUpperCase() === status.toUpperCase()
    ) {
      return;
    }

    setUpdatingId(orderId);
    setError("");

    try {
      const response = await fetch(`${API_URL}/${orderId}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          responseText || `Status update failed (${response.status}).`
        );
      }

      setSuccessDetails({
        orderId,
        status,
        customerName: getCustomerName(previousOrder),
      });

      setShowSuccessPopup(true);

      await loadOrders();
    } catch (err) {
      setError(err.message || "Failed to update order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTrackingChange = (orderId, field, value) => {
    setTrackingForms((previous) => ({
      ...previous,
      [orderId]: {
        ...previous[orderId],
        [field]: value,
      },
    }));
  };

  const saveTrackingDetails = async (orderId) => {
    const form = trackingForms[orderId];

    if (
      !form?.courierName?.trim() ||
      !form?.trackingNumber?.trim() ||
      !form?.trackingUrl?.trim()
    ) {
      setError("Please enter all courier tracking details.");
      return;
    }

    try {
      const trackingUrl = new URL(form.trackingUrl.trim());

      if (!["http:", "https:"].includes(trackingUrl.protocol)) {
        throw new Error("Invalid tracking URL.");
      }
    } catch {
      setError("Please enter a valid tracking URL starting with https://");
      return;
    }

    setSavingTrackingId(orderId);
    setError("");

    try {
      const response = await fetch(`${API_URL}/${orderId}/tracking`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          courierName: form.courierName.trim(),
          trackingNumber: form.trackingNumber.trim(),
          trackingUrl: form.trackingUrl.trim(),
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          responseText || `Tracking update failed (${response.status}).`
        );
      }

      setTrackingId(null);

      setSuccessDetails({
        orderId,
        status: "SHIPPED",
        customerName: getCustomerName(
          orders.find((order) => order.id === orderId)
        ),
      });

      setShowSuccessPopup(true);

      await loadOrders();
    } catch (err) {
      setError(err.message || "Failed to save tracking details.");
    } finally {
      setSavingTrackingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchableText = [
      order.id,
      order.shippingName,
      order.shippingPhone,
      order.user?.firstName,
      order.user?.lastName,
      order.user?.name,
      order.user?.email,
      order.shippingAddress,
      order.trackingNumber,
      order.courierName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      order.orderStatus?.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <main
        className="container-fluid min-vh-100 px-3 px-lg-4 pb-5"
        style={{
          paddingTop: "150px",
          backgroundColor: "#f5eee7",
          backgroundImage: `url("${reyasaBackground}")`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
          boxSizing: "border-box",
        }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
          <div className="mb-2 pb-3 border-bottom">
            <p
              className="text-uppercase fw-semibold mb-2"
              style={{
                color: MAROON,
                letterSpacing: "3px",
                fontSize: "0.8rem",
              }}
            >
              REYASA Administration
            </p>

            <h2 className="fw-bold mb-2" style={{ color: MAROON }}>
              <i className="bi bi-bag-check me-2"></i>
              Manage Orders
            </h2>

            <p className="mb-0" style={{ color: MAROON }}>
              View customer orders, update statuses and manage deliveries.
            </p>
          </div>

          <button
            type="button"
            className="btn text-white rounded-1 mb-3"
            style={{ backgroundColor: MAROON }}
            onClick={loadOrders}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            {loading ? "Refreshing..." : "Refresh Orders"}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger rounded-1" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}

            <button
              type="button"
              className="btn-close float-end"
              onClick={() => setError("")}
              aria-label="Close"
            ></button>
          </div>
        )}

        <div className="row g-0 mb-4 bg-white">
          <div className="col-12 col-md-4 border-bottom border-secondary-subtle">
            <div className="d-flex align-items-center gap-3 p-4">
              <i className="bi bi-bag-check fs-1"></i>
              <div>
                <div className="small">TOTAL ORDERS</div>
                <div className="fs-3 fw-bold">{stats.totalOrders}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4 border-bottom border-secondary-subtle">
            <div className="d-flex align-items-center gap-3 p-4">
              <i className="bi bi-calendar-check fs-1"></i>
              <div>
                <div className="small">TODAY'S ORDERS</div>
                <div className="fs-3 fw-bold">{stats.todaysOrders}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-3 p-4">
              <i className="bi bi-currency-rupee fs-1"></i>
              <div>
                <div className="small">TODAY'S PAID REVENUE</div>
                <div className="fs-3 fw-bold">
                  {formatCurrency(stats.todaysRevenue)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white bg-opacity-95 p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 pb-3 border-bottom">
            <h5 className="fw-bold mb-0" style={{ color: MAROON }}>
              <i className="bi bi-list-ul me-2"></i>
              Customer Orders
            </h5>

            <span
              className="badge rounded-1 px-3 py-2 text-white"
              style={{ backgroundColor: MAROON }}
            >
              {filteredOrders.length} Orders
            </span>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-7">
              <label htmlFor="orderSearch" className="form-label fw-semibold">
                Search orders
              </label>

              <input
                id="orderSearch"
                type="search"
                className="form-control"
                placeholder="Order ID, customer, phone, email or tracking number"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-5">
              <label htmlFor="statusFilter" className="form-label fw-semibold">
                Filter by status
              </label>

              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>

                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border"
                style={{ color: MAROON }}
                role="status"
              >
                <span className="visually-hidden">Loading orders...</span>
              </div>
              <p className="text-secondary mt-3">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-bag-x display-4"
                style={{ color: MAROON }}
              ></i>
              <h5 className="mt-3">No orders found</h5>
              <p className="text-secondary mb-0">
                Customer orders will appear here when available.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle mb-0">
                <thead>
                  <tr className="text-white" style={{ backgroundColor: MAROON }}>
                    <th className="text-nowrap">Order ID</th>
                    <th>Customer &amp; Delivery Details</th>
                    <th className="text-nowrap">Order Date</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Order Status</th>
                    <th style={{ minWidth: "180px" }}>Update Status</th>
                    <th style={{ minWidth: "170px" }}>Tracking</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr>
                        <td className="fw-bold" style={{ color: MAROON }}>
                          ORD{order.id}
                        </td>

                        <td>
                          <div className="fw-semibold">
                            {getCustomerName(order)}
                          </div>

                          <div className="small text-secondary mt-1">
                            <i className="bi bi-telephone me-1"></i>
                            {order.shippingPhone ||
                              order.user?.phone ||
                              "Phone unavailable"}
                          </div>

                          <div className="small text-secondary mt-1">
                            <i className="bi bi-envelope me-1"></i>
                            {order.user?.email || "Email unavailable"}
                          </div>

                          <div className="small mt-2">
                            <span className="fw-semibold">
                              <i className="bi bi-geo-alt me-1"></i>
                              Delivery address:
                            </span>
                            <div className="text-secondary mt-1">
                              {order.shippingAddress ||
                                "Delivery address unavailable"}
                            </div>
                          </div>
                        </td>

                        <td className="text-nowrap">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="fw-semibold text-nowrap">
                          {formatCurrency(order.totalAmount)}
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusClass(order.paymentStatus)}`}
                          >
                            {order.paymentStatus || "PENDING"}
                          </span>

                          <div className="small text-secondary mt-1">
                            {order.paymentMethod || "Not specified"}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusClass(order.orderStatus)}`}
                          >
                            {order.orderStatus || "PLACED"}
                          </span>
                        </td>

                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={order.orderStatus || "PLACED"}
                            disabled={
                              updatingId === order.id ||
                              order.orderStatus === "CANCELLED" ||
                              order.orderStatus === "DELIVERED"
                            }
                            aria-label={`Update order ${order.id} status`}
                            onChange={(event) =>
                              updateStatus(order.id, event.target.value)
                            }
                          >
                            {ORDER_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          {updatingId === order.id && (
                            <small className="text-secondary">
                              Updating...
                            </small>
                          )}
                        </td>

                        <td>
                          {order.trackingNumber ? (
                            <div className="small mb-2">
                              <div className="fw-semibold">
                                {order.courierName}
                              </div>
                              <div className="text-secondary">
                                {order.trackingNumber}
                              </div>
                            </div>
                          ) : (
                            <small className="text-secondary d-block mb-2">
                              Not added
                            </small>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark"
                            disabled={
                              order.orderStatus === "CANCELLED" ||
                              order.orderStatus === "DELIVERED"
                            }
                            onClick={() =>
                              setTrackingId(
                                trackingId === order.id ? null : order.id
                              )
                            }
                          >
                            <i className="bi bi-truck me-1"></i>
                            {trackingId === order.id
                              ? "Close"
                              : "Manage Tracking"}
                          </button>
                        </td>
                      </tr>

                      {trackingId === order.id && (
                        <tr>
                          <td colSpan="8" className="bg-light p-3 p-md-4">
                            <h6 className="fw-bold mb-3">
                              Tracking Details – Order ORD{order.id}
                            </h6>

                            <div className="row g-3">
                              <div className="col-12 col-md-4">
                                <label
                                  className="form-label fw-semibold"
                                  htmlFor={`courier-${order.id}`}
                                >
                                  Courier Name
                                </label>

                                <input
                                  id={`courier-${order.id}`}
                                  className="form-control"
                                  placeholder="Example: Delhivery"
                                  value={
                                    trackingForms[order.id]?.courierName || ""
                                  }
                                  onChange={(event) =>
                                    handleTrackingChange(
                                      order.id,
                                      "courierName",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="col-12 col-md-4">
                                <label
                                  className="form-label fw-semibold"
                                  htmlFor={`tracking-number-${order.id}`}
                                >
                                  Tracking Number
                                </label>

                                <input
                                  id={`tracking-number-${order.id}`}
                                  className="form-control"
                                  placeholder="Enter tracking number"
                                  value={
                                    trackingForms[order.id]?.trackingNumber ||
                                    ""
                                  }
                                  onChange={(event) =>
                                    handleTrackingChange(
                                      order.id,
                                      "trackingNumber",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="col-12 col-md-4">
                                <label
                                  className="form-label fw-semibold"
                                  htmlFor={`tracking-url-${order.id}`}
                                >
                                  Courier Tracking URL
                                </label>

                                <input
                                  id={`tracking-url-${order.id}`}
                                  type="url"
                                  className="form-control"
                                  placeholder="https://..."
                                  value={
                                    trackingForms[order.id]?.trackingUrl || ""
                                  }
                                  onChange={(event) =>
                                    handleTrackingChange(
                                      order.id,
                                      "trackingUrl",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="d-flex flex-wrap gap-2 mt-3">
                              <button
                                type="button"
                                className="btn text-white"
                                style={{ backgroundColor: MAROON }}
                                disabled={savingTrackingId === order.id}
                                onClick={() => saveTrackingDetails(order.id)}
                              >
                                {savingTrackingId === order.id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-save me-2"></i>
                                    Save Tracking Details
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setTrackingId(null)}
                              >
                                Cancel
                              </button>
                            </div>

                            <small className="text-secondary d-block mt-2">
                              Saving these details will automatically mark
                              this order as SHIPPED.
                            </small>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && (
            <p className="text-secondary small mt-3 mb-0">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          )}
        </section>

        <footer className="text-center py-4">
          <small className="fw-semibold" style={{ color: MAROON }}>
            REYASA · Created with passion. Worn with love.
          </small>
        </footer>
      </main>

      {showSuccessPopup &&
        createPortal(
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
            style={{
              zIndex: 100000,
              backgroundColor: "rgba(0, 0, 0, 0.65)",
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeSuccessPopup();
              }
            }}
          >
            <div
              className="card border-0 shadow-lg text-center"
              role="dialog"
              aria-modal="true"
              aria-labelledby="orderSuccessTitle"
              style={{
                width: "100%",
                maxWidth: "450px",
                borderRadius: "16px",
              }}
            >
              <div className="card-body p-4 p-md-5">
                <div
                  className="rounded-circle bg-success bg-opacity-10 text-success d-flex justify-content-center align-items-center mx-auto mb-3"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="bi bi-check-circle-fill display-4"></i>
                </div>

                <h3
                  id="orderSuccessTitle"
                  className="fw-bold mb-2"
                  style={{ color: MAROON }}
                >
                  Updated Successfully!
                </h3>

                <p className="text-secondary mb-4">
                  The order information has been updated successfully.
                </p>

                <div className="alert alert-light border text-start mb-4">
                  <div className="mb-2">
                    <i className="bi bi-bag-check me-2 text-success"></i>
                    <strong>Order ID:</strong> #{successDetails.orderId}
                  </div>

                  <div className="mb-2">
                    <i className="bi bi-person me-2 text-success"></i>
                    <strong>Customer:</strong> {successDetails.customerName}
                  </div>

                  <div>
                    <i className="bi bi-truck me-2 text-success"></i>
                    <strong>New Status:</strong>{" "}
                    <span className={`badge ${getStatusClass(successDetails.status)}`}>
                      {successDetails.status}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn text-white w-100"
                  style={{ backgroundColor: MAROON }}
                  onClick={closeSuccessPopup}
                >
                  <i className="bi bi-check2 me-2"></i>
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default ManageOrders;