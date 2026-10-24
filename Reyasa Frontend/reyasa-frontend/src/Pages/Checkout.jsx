
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import reyasaBackground from "../assets/reyasa-background.png";

const API_URL = "http://localhost:8080";

const initialAddress = {
  fullName: "",
  phone: "",
  addressLine: "",
  area: "",
  city: "",
  state: "",
  pinCode: "",
  landmark: "",
};

function Checkout() {
  const navigate = useNavigate();

  const [address, setAddress] = useState(initialAddress);
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    const loadCart = async () => {
      if (!userId) {
        setError("Please log in before checkout.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/cart/user/${userId}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Unable to load cart (${response.status}).`);
        }

        const data = await response.json();
        setCart(data);
      } catch (err) {
        setError(err.message || "Unable to load your cart.");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [userId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(null);

    if (!userId) {
      setError("Please log in before placing an order.");
      return;
    }

    if (!cart.items?.length) {
      setError("Your cart is empty.");
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch(
        `${API_URL}/api/customer/orders/place`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: Number(userId),
            ...address,
          }),
        }
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          responseText || `Unable to place order (${response.status}).`
        );
      }

      const result = await response.json();

      setSuccess(result);
      setCart({ items: [], subtotal: 0, total: 0 });

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      setError(err.message || "Unable to place your order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const inputFields = [
    {
      name: "fullName",
      label: "Full Name",
      placeholder: "Enter recipient's full name",
      maxLength: 100,
      autoComplete: "name",
    },
    {
      name: "phone",
      label: "Mobile Number",
      placeholder: "10-digit mobile number",
      maxLength: 10,
      autoComplete: "tel",
    },
    {
      name: "addressLine",
      label: "House / Flat Number and Street",
      placeholder: "House number, building, street",
      maxLength: 150,
      autoComplete: "address-line1",
    },
    {
      name: "area",
      label: "Area / Locality",
      placeholder: "Enter area or locality",
      maxLength: 100,
      autoComplete: "address-line2",
    },
    {
      name: "city",
      label: "City",
      placeholder: "Enter city",
      maxLength: 80,
      autoComplete: "address-level2",
    },
    {
      name: "state",
      label: "State",
      placeholder: "Enter state",
      maxLength: 80,
      autoComplete: "address-level1",
    },
    {
      name: "pinCode",
      label: "PIN Code",
      placeholder: "6-digit PIN code",
      maxLength: 6,
      autoComplete: "postal-code",
    },
  ];

  return (
    <main
      className="container-fluid min-vh-100 px-3 px-md-4 pb-5"
      style={{
        paddingTop: "110px",
        backgroundImage: `url(${reyasaBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="container">
        <div className="mb-4 pb-3 border-bottom">
          <h2 className="fw-bold mb-2" style={{ color: "#800000" }}>
            <i className="bi bi-geo-alt me-2"></i>
            Delivery Details
          </h2>
          <p className="mb-0" style={{ color: "#800000" }}>
            Enter the address where you want your REYASA order delivered.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success ? (
          <section className="bg-white bg-opacity-95 p-4 p-md-5 text-center">
            <i
              className="bi bi-check-circle display-3"
              style={{ color: "#800000" }}
            ></i>

            <h3 className="fw-bold mt-3" style={{ color: "#800000" }}>
              Thank you for your order!
            </h3>

            <p className="mb-2">
              Your order has been placed successfully.
            </p>

            <p>
              Order ID: <strong>#{success.orderId}</strong>
            </p>

            <p>
              Order total:{" "}
              <strong>{formatCurrency(success.totalAmount)}</strong>
            </p>

            <p>
              Status: <strong>{success.orderStatus}</strong>
            </p>

            <p className="text-secondary">
              Payment status: Pending. Payment has not been collected by this
              endpoint.
            </p>

            <Link
              to="/collection"
              className="btn text-white rounded-1 px-4"
              style={{ backgroundColor: "#800000" }}
            >
              Continue Shopping
            </Link>
          </section>
        ) : loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border"
              style={{ color: "#800000" }}
              role="status"
            ></div>
            <p className="mt-3">Loading your cart...</p>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-12 col-lg-7">
              <form
                className="bg-white bg-opacity-95 p-3 p-md-4"
                onSubmit={placeOrder}
              >
                <h5 className="fw-bold mb-4" style={{ color: "#800000" }}>
                  Shipping Address
                </h5>

                <div className="row g-3">
                  {inputFields.map((field) => (
                    <div
                      className={
                        field.name === "addressLine"
                          ? "col-12"
                          : "col-12 col-md-6"
                      }
                      key={field.name}
                    >
                      <label
                        htmlFor={field.name}
                        className="form-label fw-semibold"
                      >
                        {field.label} <span className="text-danger">*</span>
                      </label>

                      <input
                        id={field.name}
                        name={field.name}
                        type="text"
                        className="form-control"
                        placeholder={field.placeholder}
                        value={address[field.name]}
                        onChange={handleChange}
                        maxLength={field.maxLength}
                        autoComplete={field.autoComplete}
                        required
                        pattern={
                          field.name === "phone"
                            ? "[0-9]{10}"
                            : field.name === "pinCode"
                              ? "[0-9]{6}"
                              : undefined
                        }
                        title={
                          field.name === "phone"
                            ? "Enter a 10-digit mobile number"
                            : field.name === "pinCode"
                              ? "Enter a 6-digit PIN code"
                              : undefined
                        }
                      />
                    </div>
                  ))}

                  <div className="col-12">
                    <label htmlFor="landmark" className="form-label fw-semibold">
                      Landmark (Optional)
                    </label>

                    <input
                      id="landmark"
                      name="landmark"
                      type="text"
                      className="form-control"
                      placeholder="Nearby landmark"
                      value={address.landmark}
                      onChange={handleChange}
                      maxLength={100}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn text-white w-100 rounded-1 mt-4 py-2"
                  style={{ backgroundColor: "#800000" }}
                  disabled={placingOrder || loading || !cart.items?.length}
                >
                  {placingOrder ? "Placing Order..." : "Place Order"}
                </button>

                <Link
                  to="/cart"
                  className="btn btn-outline-secondary w-100 rounded-1 mt-2"
                >
                  Back to Cart
                </Link>
              </form>
            </div>

            <div className="col-12 col-lg-5">
              <section className="bg-white bg-opacity-95 p-3 p-md-4">
                <h5 className="fw-bold mb-3" style={{ color: "#800000" }}>
                  Order Summary
                </h5>

                {cart.items?.length ? (
                  <>
                    {cart.items.map((item) => (
                      <div
                        key={item.id}
                        className="d-flex justify-content-between gap-3 py-3 border-bottom"
                      >
                        <div>
                          <div className="fw-semibold">{item.name}</div>
                          <small className="text-secondary">
                            Size: {item.size} · Qty: {item.quantity}
                          </small>
                        </div>

                        <div className="fw-semibold text-nowrap">
                          {formatCurrency(item.itemTotal)}
                        </div>
                      </div>
                    ))}

                    <div className="d-flex justify-content-between mt-3">
                      <span>Subtotal</span>
                      <strong>{formatCurrency(cart.subtotal)}</strong>
                    </div>

                    <div className="d-flex justify-content-between mt-2">
                      <span>Delivery</span>
                      <strong className="text-success">FREE</strong>
                    </div>

                    <hr />

                    <div className="d-flex justify-content-between fs-5">
                      <strong>Total</strong>
                      <strong style={{ color: "#800000" }}>
                        {formatCurrency(cart.total)}
                      </strong>
                    </div>
                  </>
                ) : (
                  <p className="text-secondary mb-0">
                    Your cart is empty.{" "}
                    <Link to="/collection">Shop shirts</Link>
                  </p>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Checkout;
