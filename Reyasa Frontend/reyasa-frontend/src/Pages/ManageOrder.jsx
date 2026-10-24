
import React, { useCallback, useEffect, useState } from "react";
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
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
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
      setOrders(Array.isArray(orderData) ? orderData : []);

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

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    setError("");
    setMessage("");

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

      const updatedOrder = await response.json();

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId ? { ...order, ...updatedOrder } : order
        )
      );

      setMessage(`Order #${orderId} status updated to ${status}.`);
    } catch (err) {
      setError(err.message || "Failed to update order.");
    } finally {
      setUpdatingId(null);
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

  const getCustomerName = (order) => {
    if (order.shippingName?.trim()) {
      return order.shippingName;
    }

    const profileName = [
      order.user?.firstName,
      order.user?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return profileName || order.user?.name || "Customer";
  };

  const getCustomerPhone = (order) =>
    order.shippingPhone || order.user?.phone || "Phone unavailable";

  return (
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
      {/* PAGE HEADING — LEFT ALIGNED */}
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
            View customer orders and manage their status.
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

      {/* ERROR MESSAGE */}
      {error && (
        <div className="alert alert-danger rounded-1" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {message && (
        <div
          className="alert alert-success alert-dismissible fade show rounded-1"
          role="alert"
        >
          {message}

          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage("")}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* STATISTICS — FULL WIDTH */}
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

      {/* CUSTOMER ORDERS — FULL WIDTH */}
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

        {/* SEARCH AND STATUS FILTER */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-7">
            <label htmlFor="orderSearch" className="form-label fw-semibold">
              Search orders
            </label>

            <input
              id="orderSearch"
              type="search"
              className="form-control"
              placeholder="Order ID, customer, phone, email or address"
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

        {/* ORDERS TABLE */}
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
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="fw-bold" style={{ color: MAROON }}>
                      #{order.id}
                    </td>

                    <td>
                      <div className="fw-semibold">
                        {getCustomerName(order)}
                      </div>

                      <div className="small text-secondary mt-1">
                        <i className="bi bi-telephone me-1"></i>
                        {getCustomerPhone(order)}
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
                        disabled={updatingId === order.id}
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
                  </tr>
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

      {/* FOOTER */}
      <footer className="text-center py-4">
        <small className="fw-semibold" style={{ color: MAROON }}>
          REYASA · Created with passion. Worn with love.
        </small>
      </footer>
    </main>
  );
}

export default ManageOrders;
