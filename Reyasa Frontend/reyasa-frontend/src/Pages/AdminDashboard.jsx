
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import reyasaBackground from "../assets/reyasa-background.png";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalProducts: 0,
    totalCollections: 0,
  });

  const [todayOrders, setTodayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view admin dashboard data.");
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const endpoints = [
        "http://localhost:8080/api/admin/orders/stats",
        "http://localhost:8080/api/admin/orders/today",
        "http://localhost:8080/api/manageproducts/admin/all",
        "http://localhost:8080/api/collections/admin/all",
      ];

      const responses = await Promise.all(
        endpoints.map((url) => fetch(url, { headers }))
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error(
          "Unable to load dashboard data. Check your admin login and backend APIs."
        );
      }

      const [orderStats, orders, products, collections] =
        await Promise.all(
          responses.map((response) => response.json())
        );

      setStats({
        totalOrders: orderStats.totalOrders ?? 0,
        todayOrders: orderStats.todayOrders ?? 0,
        totalProducts: Array.isArray(products)
          ? products.length
          : 0,
        totalCollections: Array.isArray(collections)
          ? collections.length
          : 0,
      });

      setTodayOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Dashboard statistics
  const cards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: "bi-bag-check",
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: "bi-calendar-check",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: "bi-box-seam",
    },
    {
      title: "Collections",
      value: stats.totalCollections,
      icon: "bi-grid",
    },
  ];

  // Store Management shortcuts
  const managementItems = [

      {
  title: "Manage Enquiry Messages",
  description: "View customer enquiries, check message details, and reply to customers.",
  path: "/admin/enquiries",
  icon: "bi-envelope"
},


    {
      title: "Manage Products",
      description: "Add products, edit prices, update sizes and stock.",
      path: "/admin/manageproducts",
      icon: "bi-box-seam",
    },

    {
  title: "Material & Expenses",
  description: "Track material purchases, equipment costs, receipts and business spending.",
  path: "/admin/expenses",
  icon: "bi-cash-stack",
},
  
   
    {
      title: "Homepage Videos",
      description: "Manage videos displayed on the REYASA homepage.",
      path: "/admin/videos",
      icon: "bi-camera-video",
    },
    
    
      
{
    title: "Manage Delivery PIN Codes",
    description: "Add, enable, or disable customer delivery PIN codes.",
    path: "/admin/delivery-pins",
    icon: "bi-geo-alt"
},

{
  title: "Manage About Us",
  description: "Update REYASA's brand story, mission, vision, and sustainability information.",
  path: "/admin/about",
  icon: "bi-info-circle"
},

{
  title: "Manage Footer",
  description: "Manage footer details, contact information, quick links, social media, and policies displayed on the REYASA website.",
  path: "/admin/footer",
  icon: "bi-layout-text-window-reverse",
},


  ];

  const solidCardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e1d5cf",
    borderRadius: "12px",
    color: "#212529",
  };

  const maroon = "#800000";

  return (
    <div
      className="min-vh-100 admin-dashboard-page"
      style={{
        backgroundImage: `url(${reyasaBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* AdminNavbar is rendered only once in App.jsx */}

      <main className="container-fluid px-3 px-md-4 px-xl-5 py-4">
        {/* Dashboard heading */}
        <div className="mb-4">
          <p
            className="text-uppercase fw-bold mb-2"
            style={{
              color: maroon,
              letterSpacing: "4px",
              fontSize: "12px",
            }}
          >
            Store Management
          </p>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="fw-bold mb-2" style={{ color: maroon }}>
                Admin Dashboard
              </h1>

              <p className="mb-0 fw-semibold" style={{ color: maroon }}>
                Manage REYASA products, orders, collections and homepage content.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-dark px-4"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="alert alert-warning" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Statistics cards */}
        <div className="row g-3 g-xl-4 mb-4">
          {cards.map((card) => (
            <div
              className="col-12 col-sm-6 col-xl-3"
              key={card.title}
            >
              <div className="card h-100 shadow-sm" style={solidCardStyle}>
                <div className="card-body p-4 d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-secondary mb-2">{card.title}</p>
                    <h2 className="fw-bold mb-0">
                      {loading ? "..." : card.value}
                    </h2>
                  </div>

                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "52px",
                      height: "52px",
                      backgroundColor: "#f4e8e8",
                      color: maroon,
                    }}
                  >
                    <i className={`bi ${card.icon} fs-3`}></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Store Management shortcuts */}
        <h5 className="fw-bold mb-3" style={{ color: maroon }}>
          Store Management
        </h5>

        <div className="row g-3 mb-5">
          {managementItems.map((item) => (
            <div
              className="col-12 col-md-6 col-xl-3"
              key={item.title}
            >
              <Link to={item.path} className="text-decoration-none">
                <div className="card h-100 shadow-sm" style={solidCardStyle}>
                  <div className="card-body p-4">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#f4e8e8",
                        color: maroon,
                      }}
                    >
                      <i className={`bi ${item.icon} fs-3`}></i>
                    </div>

                    <h6 className="fw-bold">{item.title}</h6>

                    <p className="small text-secondary mb-3">
                      {item.description}
                    </p>

                    <span
                      className="small fw-semibold"
                      style={{ color: maroon }}
                    >
                      Manage now
                      <i className="bi bi-arrow-right ms-2"></i>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Today's orders */}
        <div className="card shadow-sm" style={solidCardStyle}>
          <div className="card-body p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: maroon }}>
                  Today's Orders
                </h5>

                <p className="small text-secondary mb-0">
                  Latest customer purchases
                </p>
              </div>

              <Link
                to="/admin/orders"
                className="btn btn-dark btn-sm px-3"
              >
                View All Orders
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-dark" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : todayOrders.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-bag fs-1 text-secondary"></i>
                <p className="text-secondary mt-3 mb-0">
                  No orders found for today.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {todayOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="fw-semibold">#{order.id}</td>

                        <td>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("en-IN")
                            : "-"}
                        </td>

                        <td>
                          <span className="badge bg-light text-dark border">
                            {order.orderStatus || "-"}
                          </span>
                        </td>

                        <td>{order.paymentStatus || "-"}</td>

                        <td className="text-end fw-semibold">
                          ₹
                          {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard footer */}
        <div className="text-center py-4">
          <small
            className="fw-semibold"
            style={{
              color: maroon,
              letterSpacing: "2px",
            }}
          >
            REYASA · CREATED WITH PASSION. WORN WITH LOVE.
          </small>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
