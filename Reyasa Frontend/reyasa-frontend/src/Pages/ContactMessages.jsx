
import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import EnquiryServices from "../services/EnquiryService";
import heroBackground from "../assets/reyasa-background.png";

function ContactMessages() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [reply, setReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [message, setMessage] = useState("");

  // SUCCESS POPUP
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    customerName: "",
    email: "",
  });

  // LOAD ENQUIRIES
  const loadEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let response;

      if (selectedStatus === "ALL") {
        response = await EnquiryServices.getAllEnquiries();
      } else {
        response = await EnquiryServices.getEnquiriesByStatus(
          selectedStatus
        );
      }

      const data = response?.data;

      if (Array.isArray(data)) {
        setEnquiries(data);
      } else if (Array.isArray(data?.enquiries)) {
        setEnquiries(data.enquiries);
      } else {
        setEnquiries([]);
      }
    } catch (err) {
      console.error("Error loading enquiries:", err);

      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "") ||
          "Failed to load customer enquiries. Please try again."
      );

      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  // OPEN ENQUIRY
  const openEnquiry = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setReply(enquiry.adminReply || "");
    setMessage("");
  };

  // CLOSE ENQUIRY
  const closeEnquiry = () => {
    if (replyLoading) return;

    setSelectedEnquiry(null);
    setReply("");
    setMessage("");
  };

  // CLOSE SUCCESS POPUP
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  // SEND REPLY
  const handleReply = async (event) => {
    event.preventDefault();

    if (!selectedEnquiry) return;

    if (!reply.trim()) {
      setMessage("Please enter a reply before submitting.");
      return;
    }

    const customerName = selectedEnquiry.customerName || "Customer";
    const customerEmail = selectedEnquiry.email || "";

    try {
      setReplyLoading(true);
      setMessage("");
      setError("");

      // Submit the reply to the backend.
      // The backend should save the reply and send the email.
      await EnquiryServices.replyToEnquiry(
        selectedEnquiry.id,
        reply.trim()
      );

      // Close the reply modal after success.
      setSelectedEnquiry(null);
      setReply("");
      setMessage("");

      // Prepare success popup details.
      setSuccessDetails({
        customerName,
        email: customerEmail,
      });

      setShowSuccessPopup(true);

      // Refresh the enquiry list.
      await loadEnquiries();
    } catch (err) {
      console.error("Error replying to enquiry:", err);

      setMessage(
        err.response?.data?.message ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "") ||
          "Failed to send reply. Please try again."
      );
    } finally {
      setReplyLoading(false);
    }
  };

  // FORMAT DATE
  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // SUMMARY COUNTS
  const pendingCount = enquiries.filter(
    (enquiry) => enquiry.status?.toUpperCase() === "PENDING"
  ).length;

  const repliedCount = enquiries.filter(
    (enquiry) => enquiry.status?.toUpperCase() === "REPLIED"
  ).length;

  return (
    <>
      {/* MAIN PAGE */}
      <main
        className="container-fluid px-3 px-md-4 pb-4 pb-md-5"
        style={{
          backgroundColor: "#f5eee7",
          backgroundImage: `url("${heroBackground}")`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
          minHeight: "100vh",
          paddingTop: "150px",
          boxSizing: "border-box",
        }}
      >
        {/* PAGE HEADING */}
        <div className="mb-4">
          <p
            className="text-uppercase fw-semibold mb-2"
            style={{
              color: "#800000",
              letterSpacing: "3px",
              fontSize: "0.8rem",
            }}
          >
            REYASA Administration
          </p>

          <h2 className="fw-bold mb-2" style={{ color: "#800000" }}>
            Customer Enquiries
          </h2>

          <p className="mb-0" style={{ color: "#800000" }}>
            Manage customer questions and messages sent to REYASA.
          </p>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            <span>{String(error)}</span>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-secondary mb-2">Total Enquiries</p>
                    <h3 className="fw-bold mb-0">{enquiries.length}</h3>
                  </div>

                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "54px",
                      height: "54px",
                      backgroundColor: "#f5e6e6",
                      color: "#800000",
                      flexShrink: 0,
                    }}
                  >
                    <i className="bi bi-envelope fs-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-secondary mb-2">Pending Enquiries</p>
                    <h3 className="fw-bold mb-0">{pendingCount}</h3>
                  </div>

                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "54px",
                      height: "54px",
                      backgroundColor: "#fff3cd",
                      color: "#856404",
                      flexShrink: 0,
                    }}
                  >
                    <i className="bi bi-clock-history fs-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-secondary mb-2">Replied Enquiries</p>
                    <h3 className="fw-bold mb-0">{repliedCount}</h3>
                  </div>

                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "54px",
                      height: "54px",
                      backgroundColor: "#d1e7dd",
                      color: "#0f5132",
                      flexShrink: 0,
                    }}
                  >
                    <i className="bi bi-check-circle fs-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER INBOX */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <h4 className="fw-bold mb-1">Customer Inbox</h4>

                <p className="text-secondary mb-0">
                  View customer messages and respond to enquiries.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-dark"
                onClick={loadEnquiries}
                disabled={loading}
              >
                <i
                  className={`bi ${
                    loading ? "bi-arrow-repeat" : "bi-arrow-clockwise"
                  } me-2`}
                />

                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {/* STATUS FILTER */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4 col-lg-3">
                <label
                  htmlFor="enquiryStatus"
                  className="form-label fw-semibold"
                >
                  Filter by Status
                </label>

                <select
                  id="enquiryStatus"
                  className="form-select"
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                >
                  <option value="ALL">All Enquiries</option>
                  <option value="PENDING">Pending</option>
                  <option value="REPLIED">Replied</option>
                </select>
              </div>
            </div>

            {/* LOADING */}
            {loading && (
              <div className="text-center py-5">
                <div
                  className="spinner-border"
                  style={{ color: "#800000" }}
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>

                <p className="text-secondary mt-3 mb-0">
                  Loading customer enquiries...
                </p>
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && enquiries.length === 0 && (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-4 text-secondary" />

                <h5 className="mt-3">No enquiries found</h5>

                <p className="text-secondary mb-0">
                  Customer enquiries will appear here when available.
                </p>
              </div>
            )}

            {/* ENQUIRIES TABLE */}
            {!loading && enquiries.length > 0 && (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Customer</th>
                      <th scope="col">Email</th>
                      <th scope="col">Subject</th>
                      <th scope="col">Message</th>
                      <th scope="col">Received On</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-center">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {enquiries.map((enquiry) => (
                      <tr key={enquiry.id}>
                        <td className="fw-semibold">
                          {enquiry.customerName || "—"}
                        </td>

                        <td className="text-break">
                          {enquiry.email || "—"}
                        </td>

                        <td>{enquiry.subject || "—"}</td>

                        <td style={{ minWidth: "220px", maxWidth: "320px" }}>
                          <span
                            className="d-inline-block text-truncate"
                            style={{ maxWidth: "100%" }}
                            title={enquiry.message || ""}
                          >
                            {enquiry.message || "—"}
                          </span>
                        </td>

                        <td className="text-nowrap">
                          {formatDate(enquiry.createdAt)}
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              enquiry.status?.toUpperCase() === "REPLIED"
                                ? "text-bg-success"
                                : "text-bg-warning"
                            }`}
                          >
                            {enquiry.status || "PENDING"}
                          </span>
                        </td>

                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark text-nowrap"
                            onClick={() => openEnquiry(enquiry)}
                          >
                            <i className="bi bi-eye me-1" />
                            View / Reply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* REPLY MODAL */}
      {selectedEnquiry &&
        createPortal(
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{
              zIndex: 99999,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              padding: "12px",
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeEnquiry();
              }
            }}
          >
            <div
              className="bg-white rounded-3 shadow-lg d-flex flex-column"
              role="dialog"
              aria-modal="true"
              aria-labelledby="enquiryModalTitle"
              style={{
                width: "100%",
                maxWidth: "850px",
                maxHeight: "90vh",
                overflow: "hidden",
              }}
            >
              <div className="d-flex justify-content-between align-items-center border-bottom p-3 p-md-4">
                <div className="me-3">
                  <h5 className="fw-bold mb-1" id="enquiryModalTitle">
                    Customer Enquiry
                  </h5>

                  <small className="text-secondary">
                    Received {formatDate(selectedEnquiry.createdAt)}
                  </small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeEnquiry}
                  disabled={replyLoading}
                />
              </div>

              <form
                onSubmit={handleReply}
                className="d-flex flex-column flex-grow-1 overflow-hidden"
              >
                <div className="p-3 p-md-4 overflow-auto">
                  {message && (
                    <div className="alert alert-danger" role="alert">
                      {String(message)}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Customer Name
                      </label>

                      <div className="form-control bg-light text-break">
                        {selectedEnquiry.customerName || "—"}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Email Address
                      </label>

                      <div className="form-control bg-light text-break">
                        {selectedEnquiry.email || "—"}
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Subject
                      </label>

                      <div className="form-control bg-light text-break">
                        {selectedEnquiry.subject || "—"}
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Customer Message
                      </label>

                      <div
                        className="form-control bg-light text-break"
                        style={{
                          minHeight: "60px",
                          height: "auto",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {selectedEnquiry.message || "—"}
                      </div>
                    </div>

                    {selectedEnquiry.adminReply && (
                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Previous Admin Reply
                        </label>

                        <div
                          className="form-control bg-light text-break"
                          style={{
                            minHeight: "60px",
                            height: "auto",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {selectedEnquiry.adminReply}
                        </div>
                      </div>
                    )}

                    <div className="col-12">
                      <label
                        htmlFor="adminReply"
                        className="form-label fw-semibold"
                      >
                        Your Reply
                      </label>

                      <textarea
                        id="adminReply"
                        className="form-control"
                        rows="4"
                        placeholder="Type your reply to the customer..."
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        required
                        disabled={replyLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-top p-3 d-flex justify-content-end gap-2 bg-white">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeEnquiry}
                    disabled={replyLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-dark"
                    disabled={replyLoading || !reply.trim()}
                  >
                    {replyLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* SUCCESS POPUP */}
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
              aria-labelledby="replySuccessTitle"
              style={{
                width: "100%",
                maxWidth: "460px",
                borderRadius: "16px",
              }}
            >
              <div className="card-body p-4 p-md-5">
                <div
                  className="rounded-circle bg-success bg-opacity-10 text-success d-flex justify-content-center align-items-center mx-auto mb-3"
                  style={{
                    width: "80px",
                    height: "80px",
                  }}
                >
                  <i className="bi bi-check-circle-fill display-4" />
                </div>

                <h3
                  className="fw-bold mb-2"
                  id="replySuccessTitle"
                  style={{ color: "#800000" }}
                >
                  Reply Sent Successfully!
                </h3>

                <p className="text-secondary mb-4">
                  Your response to{" "}
                  <strong>{successDetails.customerName}</strong> was
                  successfully processed.
                </p>

                <div className="alert alert-light border text-start">
                  <div className="mb-2">
                    <i className="bi bi-person me-2 text-success" />
                    <strong>Customer:</strong>{" "}
                    {successDetails.customerName}
                  </div>

                  <div className="text-break">
                    <i className="bi bi-envelope me-2 text-success" />
                    <strong>Email:</strong>{" "}
                    {successDetails.email || "Not available"}
                  </div>
                </div>

                

                <button
                  type="button"
                  className="btn btn-dark w-100"
                  onClick={closeSuccessPopup}
                >
                  <i className="bi bi-check2 me-2" />
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default ContactMessages;
