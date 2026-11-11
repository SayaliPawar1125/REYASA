import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://localhost:8080/api/customer/orders";
const MAROON = "#800000";

const TRACKING_STEPS = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

function OrderTracking() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTracking = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in to track your order.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/${orderId}/tracking`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Order not found.");
          }

          if (response.status === 403 || response.status === 401) {
            throw new Error("You are not authorized to view this order.");
          }

          throw new Error("Unable to load tracking information.");
        }

        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTracking();
  }, [orderId]);

  const formatDate = (date) => {
    if (!date) return "—";

    const value = new Date(date);

    return Number.isNaN(value.getTime())
      ? "—"
      : value.toLocaleString("en-IN");
  };

  const currentStatus = order?.orderStatus?.toUpperCase();

  const currentStep = TRACKING_STEPS.indexOf(currentStatus);

  const isCancelled = currentStatus === "CANCELLED";

  const isCompleted = currentStatus === "DELIVERED";

  const isStepCompleted = (step) => {
    if (isCancelled) return false;

    const stepIndex = TRACKING_STEPS.indexOf(step);

    return currentStep >= stepIndex;
  };

  return (
    <main className="container py-5" style={{ paddingTop: "150px" }}>
      <div className="mb-4">
        <Link
          to="/my-orders"
          className="text-decoration-none text-secondary"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to My Orders
        </Link>
      </div>

      <h2 className="fw-bold mb-2" style={{ color: MAROON }}>
        <i className="bi bi-truck me-2"></i>
        Track Your Order
      </h2>

      <p className="text-secondary mb-4">
        Order ID: #{orderId}
      </p>

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border"
            style={{ color: MAROON }}
          ></div>
          <p className="mt-3 text-secondary">
            Loading tracking information...
          </p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : order ? (
        <>
          {isCancelled && (
            <div className="alert alert-danger">
              <i className="bi bi-x-circle me-2"></i>
              This order has been cancelled.
            </div>
          )}

          {isCompleted && (
            <div className="alert alert-success">
              <i className="bi bi-check-circle me-2"></i>
              Your order has been delivered successfully!
            </div>
          )}

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap justify-content-between gap-3">
                <div>
                  <small className="text-secondary">Order Status</small>
                  <h4 className="fw-bold mt-1">
                    {currentStatus}
                  </h4>
                </div>

                <div>
                  <small className="text-secondary">Order Date</small>
                  <h6 className="fw-semibold mt-1">
                    {formatDate(order.createdAt)}
                  </h6>
                </div>
              </div>

              <hr />

              <h5 className="fw-bold mb-4">Delivery Progress</h5>

              <div className="list-group list-group-flush">
                {TRACKING_STEPS.map((step, index) => {
                  const completed = isStepCompleted(step);

                  let date = null;

                  if (step === "SHIPPED") {
                    date = order.shippedAt;
                  }

                  if (step === "DELIVERED") {
                    date = order.deliveredAt;
                  }

                  return (
                    <div
                      className="list-group-item border-0 px-0 py-3"
                      key={step}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className={`rounded-circle d-flex justify-content-center align-items-center flex-shrink-0 ${
                            completed
                              ? "bg-success text-white"
                              : "bg-light text-secondary border"
                          }`}
                          style={{ width: "38px", height: "38px" }}
                        >
                          {completed ? (
                            <i className="bi bi-check-lg"></i>
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div className="flex-grow-1">
                          <h6
                            className={`fw-bold mb-1 ${
                              completed ? "text-success" : "text-secondary"
                            }`}
                          >
                            {step}
                          </h6>

                          <small className="text-secondary">
                            {date
                              ? formatDate(date)
                              : completed
                                ? "Completed"
                                : "Waiting for update"}
                          </small>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Courier Details</h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <small className="text-secondary">Courier Name</small>
                  <h6 className="fw-semibold mt-1">
                    {order.courierName || "Not available"}
                  </h6>
                </div>

                <div className="col-md-4">
                  <small className="text-secondary">Tracking Number</small>
                  <h6 className="fw-semibold mt-1">
                    {order.trackingNumber || "Not available"}
                  </h6>
                </div>

                <div className="col-md-4">
                  <small className="text-secondary">Shipped Date</small>
                  <h6 className="fw-semibold mt-1">
                    {formatDate(order.shippedAt)}
                  </h6>
                </div>
              </div>

              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn text-white mt-4"
                  style={{ backgroundColor: MAROON }}
                >
                  <i className="bi bi-box-arrow-up-right me-2"></i>
                  Track on Courier Website
                </a>
              )}

              {!order.trackingUrl && (
                <p className="text-secondary small mt-3 mb-0">
                  Courier tracking link will appear after the admin adds
                  shipping details.
                </p>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Delivery Address</h5>
              <p className="mb-1 fw-semibold">{order.shippingName}</p>
              <p className="mb-1">{order.shippingPhone}</p>
              <p className="text-secondary mb-0">
                {order.shippingAddress}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}

export default OrderTracking;