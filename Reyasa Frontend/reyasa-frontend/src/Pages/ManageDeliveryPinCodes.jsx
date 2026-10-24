import React, { useEffect, useState } from "react";
import DeliveryPinCodeServices from "../services/DeliveryPinCodeServices";
import heroBackground from "../assets/reyasa-background.png";

function ManageDeliveryPinCodes() {
  const [pinCode, setPinCode] = useState("");
  const [pinCodes, setPinCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const maroon = "#800000";

  // Load delivery PIN codes
  const loadPinCodes = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await DeliveryPinCodeServices.getDeliveryPinCodes();

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setPinCodes(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load delivery PIN codes. Check your admin login."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPinCodes();
  }, []);

  // Add delivery PIN code
  const handleAdd = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanedPin = pinCode.trim();

    if (!/^\d{6}$/.test(cleanedPin)) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }

    try {
      setSaving(true);

      await DeliveryPinCodeServices.addDeliveryPinCode(cleanedPin);

      setPinCode("");
      setMessage("Delivery PIN code added successfully.");

      await loadPinCodes();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to add the PIN code."
      );
    } finally {
      setSaving(false);
    }
  };

  // Enable or disable a PIN code
  const handleStatusChange = async (item) => {
    setError("");
    setMessage("");
    setUpdatingId(item.id);

    try {
      await DeliveryPinCodeServices.updateDeliveryPinCodeStatus(
        item.id,
        !item.active
      );

      setMessage(`PIN code ${item.pinCode} updated successfully.`);

      await loadPinCodes();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update PIN code status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete a PIN code
  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete delivery PIN code ${item.pinCode}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(item.id);

    try {
      await DeliveryPinCodeServices.deleteDeliveryPinCode(item.id);

      setMessage("Delivery PIN code deleted successfully.");

      await loadPinCodes();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete the PIN code."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = pinCodes.filter(
    (item) => item.active
  ).length;

  const disabledCount = pinCodes.length - activeCount;

  return (
    <main
      className="container-fluid px-3 px-md-4 pb-4 pb-md-5"
      style={{
        backgroundColor: "#f5eee7",
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll",

        // Space for the fixed admin navbar
        paddingTop: "150px",

        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div className="container">

        {/* PAGE HEADING */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <p
              className="text-uppercase fw-bold mb-2"
              style={{
                color: maroon,
                letterSpacing: "3px",
                fontSize: "12px",
              }}
            >
              REYASA Administration
            </p>

            <h2
              className="fw-bold mb-2"
              style={{
                color: maroon,
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              }}
            >
              <i className="bi bi-geo-alt me-2"></i>
              Manage Delivery PIN Codes
            </h2>

            <p
              className="mb-0"
              style={{ color: maroon }}
            >
              Manage the destination PIN codes where REYASA accepts
              deliveries.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-dark px-4"
            onClick={loadPinCodes}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="alert alert-success" role="status">
            <i className="bi bi-check-circle me-2"></i>
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-4">
            <div className="card h-100 border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#f4e8e8",
                      color: maroon,
                    }}
                  >
                    <i className="bi bi-geo fs-4"></i>
                  </div>

                  <div>
                    <p className="text-secondary mb-1">
                      Total PIN Codes
                    </p>
                    <h3 className="fw-bold mb-0">
                      {loading ? "..." : pinCodes.length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-4">
            <div className="card h-100 border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#e8f5e9",
                      color: "#198754",
                    }}
                  >
                    <i className="bi bi-check-circle fs-4"></i>
                  </div>

                  <div>
                    <p className="text-secondary mb-1">
                      Delivery Enabled
                    </p>
                    <h3 className="fw-bold mb-0">
                      {loading ? "..." : activeCount}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-4">
            <div className="card h-100 border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#eeeeee",
                      color: "#6c757d",
                    }}
                  >
                    <i className="bi bi-slash-circle fs-4"></i>
                  </div>

                  <div>
                    <p className="text-secondary mb-1">
                      Delivery Disabled
                    </p>
                    <h3 className="fw-bold mb-0">
                      {loading ? "..." : disabledCount}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ADD PIN CODE FORM */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1" style={{ color: maroon }}>
              Add Delivery PIN Code
            </h5>

            <p className="text-secondary small mb-4">
              Enter a six-digit destination PIN code.
            </p>

            <form
              onSubmit={handleAdd}
              className="row g-3 align-items-end"
            >
              <div className="col-12 col-md-6">
                <label
                  htmlFor="deliveryPinCode"
                  className="form-label fw-semibold"
                >
                  Delivery PIN Code
                </label>

                <input
                  id="deliveryPinCode"
                  type="text"
                  className="form-control"
                  placeholder="Enter 6-digit PIN code"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                  value={pinCode}
                  onChange={(event) =>
                    setPinCode(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  required
                />
              </div>

              <div className="col-12 col-md-3">
                <button
                  type="submit"
                  className="btn btn-dark w-100"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>
                      Add PIN Code
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* DELIVERY COVERAGE TABLE */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-0">
            <div className="p-4 border-bottom">
              <h5 className="fw-bold mb-1" style={{ color: maroon }}>
                Delivery Coverage
              </h5>

              <p className="text-secondary small mb-0">
                Enable or disable delivery for individual PIN codes.
              </p>
            </div>

            {loading ? (
              <div className="text-center p-5">
                <div
                  className="spinner-border"
                  style={{ color: maroon }}
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>

                <p className="mt-3 mb-0">
                  Loading PIN codes...
                </p>
              </div>
            ) : pinCodes.length === 0 ? (
              <div className="text-center p-5">
                <i className="bi bi-geo fs-1 text-secondary"></i>

                <p className="mt-3 fw-semibold mb-1">
                  No delivery PIN codes added yet.
                </p>

                <p className="text-secondary small mb-0">
                  Add a PIN code above to configure delivery coverage.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">PIN Code</th>
                      <th>Status</th>
                      <th>Added On</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pinCodes.map((item) => (
                      <tr key={item.id}>
                        <td className="ps-4 fw-semibold">
                          {item.pinCode}
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              item.active
                                ? "text-bg-success"
                                : "text-bg-secondary"
                            }`}
                          >
                            {item.active
                              ? "Delivery Enabled"
                              : "Delivery Disabled"}
                          </span>
                        </td>

                        <td>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString(
                                "en-IN"
                              )
                            : "—"}
                        </td>

                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end flex-wrap gap-2">
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                item.active
                                  ? "btn-outline-warning"
                                  : "btn-outline-success"
                              }`}
                              onClick={() => handleStatusChange(item)}
                              disabled={
                                updatingId === item.id ||
                                deletingId === item.id
                              }
                            >
                              {updatingId === item.id
                                ? "Updating..."
                                : item.active
                                  ? "Disable"
                                  : "Enable"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(item)}
                              disabled={
                                deletingId === item.id ||
                                updatingId === item.id
                              }
                            >
                              {deletingId === item.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER BRAND MESSAGE */}
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

      </div>
    </main>
  );
}

export default ManageDeliveryPinCodes;