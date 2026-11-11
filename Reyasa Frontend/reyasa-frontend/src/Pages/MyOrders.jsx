
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import heroBackground from "../assets/reyasa-background.png";

const API_URL = "http://localhost:8080/api/customer/orders";
const MAROON = "#800000";

function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const loadOrders = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/my-orders`, {
          headers: getHeaders(),
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error("Please log in again to view your orders.");
        }

        if (!response.ok) {
          throw new Error("Unable to load your orders.");
        }

        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [navigate]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

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
        return "bg-success";

      case "CANCELLED":
        return "bg-danger";

      case "SHIPPED":
        return "bg-primary";

      case "PROCESSING":
        return "bg-info text-dark";

      case "CONFIRMED":
        return "bg-secondary";

      default:
        return "bg-warning text-dark";
    }
  };

  return (
    <main
      className="container-fluid px-3 px-md-4 pb-5"
      style={{
        paddingTop: "150px",
        minHeight: "100vh",
        backgroundColor: "#f5eee7",
        backgroundImage: `url("${heroBackground}")`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll",
        boxSizing: "border-box",
      }}
    >
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold" style={{ color: MAROON }}>
            <i className="bi bi-bag-check me-2"></i>
            My Orders
          </h2>

          <p className="mb-0" style={{ color: MAROON }}>
            View your orders and track your deliveries.
          </p>
        </div>

        <Link to="/collection" className="btn btn-outline-dark mt-3 mt-md-0">
          Continue Shopping
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border"
            style={{ color: MAROON }}
            role="status"
          ></div>
          <p className="mt-3 text-secondary">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center bg-light p-5 rounded">
          <i className="bi bi-bag-x display-3 text-secondary"></i>
          <h4 className="mt-3">No orders yet</h4>
          <p className="text-secondary">
            Your placed orders will appear here.
          </p>
          <Link
            to="/collection"
            className="btn text-white"
            style={{ backgroundColor: MAROON }}
          >
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {orders.map((order) => (
            <div className="col-12" key={order.id}>
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3 p-md-4">
                  <div className="d-flex flex-wrap justify-content-between gap-3">
                    <div>
                      <h5 className="fw-bold mb-1">
                        Order ORD{order.id}
                      </h5>

                      <small className="text-secondary">
                        Placed on {formatDate(order.createdAt)}
                      </small>
                    </div>

                    <span
                      className={`badge ${getStatusClass(order.orderStatus)} align-self-start px-3 py-2`}
                    >
                      {order.orderStatus || "PLACED"}
                    </span>
                  </div>

                  <hr />

                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <small className="text-secondary">Total Amount</small>
                      <h6 className="fw-bold mt-1">
                        {formatCurrency(order.totalAmount)}
                      </h6>
                    </div>

                    <div className="col-6 col-md-3">
                      <small className="text-secondary">Payment</small>
                      <h6 className="fw-bold mt-1">
                        {order.paymentStatus || "PENDING"}
                      </h6>
                    </div>

                    <div className="col-6 col-md-3">
                      <small className="text-secondary">Payment Method</small>
                      <h6 className="fw-bold mt-1">
                        {order.paymentMethod || "—"}
                      </h6>
                    </div>

                    <div className="col-6 col-md-3">
                      <small className="text-secondary">Courier</small>
                      <h6 className="fw-bold mt-1">
                        {order.courierName || "Not shipped yet"}
                      </h6>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4">
                    <span className="small text-secondary">
                      {order.trackingNumber
                        ? `Tracking No: ${order.trackingNumber}`
                        : "Tracking details will be available after shipping."}
                    </span>

                    <Link
                      to={`/track-order/${order.id}`}
                      className="btn text-white"
                      style={{ backgroundColor: MAROON }}
                    >
                      <i className="bi bi-truck me-2"></i>
                      Track Order
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyOrders;
