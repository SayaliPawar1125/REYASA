
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import reyasaBackground from "../assets/reyasa-background.png";

const API_URL = "http://localhost:8080";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

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
  const location = useLocation();

  const [address, setAddress] = useState(initialAddress);

  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [deliveryAvailability, setDeliveryAvailability] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Get selected cart items passed from Cart.jsx.
  const selectedItemsFromCart = location.state?.selectedItems || [];

  // Send only cart item IDs to the backend.
  const selectedCartItemIds = useMemo(
    () =>
      selectedItemsFromCart
        .map((item) => item.id)
        .filter((id) => id !== undefined && id !== null)
        .map(String),
    [selectedItemsFromCart]
  );

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const deliveryConfirmed =
    deliveryAvailability?.pinCode === address.pinCode.trim() &&
    deliveryAvailability?.available === true;

  // Calculate selected product subtotal using cart data from backend.
  const calculateItemTotal = (item) => {
    if (item.itemTotal !== undefined && item.itemTotal !== null) {
      return Number(item.itemTotal);
    }

    return Number(item.price || 0) * Number(item.quantity || 0);
  };

  const checkoutSubtotal = cart.items.reduce(
    (total, item) => total + calculateItemTotal(item),
    0
  );

  // REYASA currently provides free delivery.
  const checkoutDelivery = 0;
  const checkoutTotal = checkoutSubtotal + checkoutDelivery;

  // Load Razorpay Checkout script.
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });

  // Load only the products selected on the Cart page.
  useEffect(() => {
    let cancelled = false;

    const loadSelectedCartItems = async () => {
      if (!userId || !token) {
        setError("Please log in before checkout.");
        setLoading(false);
        return;
      }

      if (selectedCartItemIds.length === 0) {
        setError("Please select at least one product from your cart.");
        setLoading(false);
        navigate("/cart", { replace: true });
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/cart/user/${userId}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error("Unable to load your cart.");
        }

        const data = await response.json();

        // Match backend cart items with selected cart item IDs.
        const selectedIdSet = new Set(selectedCartItemIds);

        const selectedCartItems = (data.items || []).filter((item) =>
          selectedIdSet.has(String(item.id))
        );

        if (selectedCartItems.length === 0) {
          throw new Error(
            "Your selected products are no longer available in your cart. Please select them again."
          );
        }

        if (!cancelled) {
          const subtotal = selectedCartItems.reduce(
            (total, item) => total + calculateItemTotal(item),
            0
          );

          setCart({
            items: selectedCartItems,
            subtotal,
            total: subtotal,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load selected products.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSelectedCartItems();

    return () => {
      cancelled = true;
    };
  }, [userId, token, navigate, selectedCartItemIds]);

  // Update address.
  const handleChange = (event) => {
    const { name, value } = event.target;

    const updatedValue =
      name === "phone" || name === "pinCode"
        ? value.replace(/\D/g, "")
        : value;

    setAddress((previous) => ({
      ...previous,
      [name]: updatedValue,
    }));

    setError("");
    setPaymentMessage("");

    if (name === "pinCode") {
      setDeliveryAvailability(null);
    }
  };

  // Check delivery PIN with the backend.
  const checkDelivery = async () => {
    const pinCode = address.pinCode.trim();

    setError("");
    setDeliveryAvailability(null);

    if (!/^\d{6}$/.test(pinCode)) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    setCheckingDelivery(true);

    try {
      const response = await fetch(
        `${API_URL}/api/warehouse/delivery-pins/check?pinCode=${encodeURIComponent(
          pinCode
        )}`
      );

      if (!response.ok) {
        throw new Error("Unable to check delivery availability.");
      }

      const result = await response.json();

      setDeliveryAvailability({
        pinCode,
        available: result.available === true,
        message: result.message,
      });
    } catch (err) {
      setError(err.message || "Unable to check delivery.");
    } finally {
      setCheckingDelivery(false);
    }
  };

  // Navigate to the existing enquiry page.
  const handleDeliveryEnquiry = () => {
    navigate(
      `/enquiry?product=${encodeURIComponent(
        `Delivery PIN: ${address.pinCode.trim()}`
      )}`
    );
  };

  // Validate the delivery address and selected products.
  const validateAddress = () => {
    if (!userId || !token) {
      return "Please log in before placing an order.";
    }

    if (!cart.items?.length) {
      return "No selected products found.";
    }

    if (selectedCartItemIds.length === 0) {
      return "Please select products from your cart.";
    }

    if (!deliveryConfirmed) {
      return "Please check and confirm delivery availability first.";
    }

    if (!/^\d{10}$/.test(address.phone.trim())) {
      return "Please enter a valid 10-digit mobile number.";
    }

    const requiredFields = [
      ["fullName", "Full Name"],
      ["addressLine", "House / Flat Number and Street"],
      ["area", "Area / Locality"],
      ["city", "City"],
      ["state", "State"],
    ];

    for (const [field, label] of requiredFields) {
      if (!address[field].trim()) {
        return `Please enter ${label}.`;
      }
    }

    return "";
  };

  // Place an order containing only the selected cart items.
  // Backend verifies Razorpay payment before saving the order.
  const placeOrderAfterPayment = async (paymentResponse) => {
    const response = await fetch(
      `${API_URL}/api/customer/orders/place`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          selectedCartItemIds: selectedCartItemIds.map(Number),

          // Delivery address
          fullName: address.fullName,
          phone: address.phone,
          addressLine: address.addressLine,
          area: address.area,
          city: address.city,
          state: address.state,
          pinCode: address.pinCode,
          landmark: address.landmark,

          // Razorpay payment details
          paymentOrderId: paymentResponse.razorpay_order_id,
          paymentId: paymentResponse.razorpay_payment_id,
          razorpaySignature: paymentResponse.razorpay_signature,
        }),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message ||
          result.detail ||
          "Payment was received, but order placement failed. Contact support with your payment ID."
      );
    }

    return result;
  };

  // Pay Now: create Razorpay order, open checkout, and place customer order.
  const handlePayNow = async (event) => {
    event.preventDefault();

    setError("");
    setPaymentMessage("");

    const validationMessage = validateAddress();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (
      !RAZORPAY_KEY_ID ||
      RAZORPAY_KEY_ID === "YOUR_RAZORPAY_KEY_ID"
    ) {
      setError(
        "Configure your Razorpay Key ID in your frontend .env file before testing payments."
      );
      return;
    }

    setPlacingOrder(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Unable to load Razorpay. Check your internet connection and try again."
        );
      }

      // Ask the backend to create a Razorpay order for selected products only.
      const createResponse = await fetch(
        `${API_URL}/api/payment/create-order`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            selectedCartItemIds: selectedCartItemIds.map(Number),
          }),
        }
      );

      const paymentOrder = await createResponse.json().catch(() => ({}));

      if (!createResponse.ok) {
        throw new Error(
          paymentOrder.message ||
            paymentOrder.detail ||
            "Unable to create payment order."
        );
      }

      if (!paymentOrder.id || !paymentOrder.amount) {
        throw new Error(
          "The backend did not return a valid Razorpay order ID and amount."
        );
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || "INR",
        name: "REYASA",
        description: "REYASA Order Payment",
        order_id: paymentOrder.id,

        handler: async (paymentResponse) => {
          try {
            setPaymentMessage(
              "Verifying payment and confirming your order..."
            );

            // Backend verifies the Razorpay signature and saves the order.
            const orderResult =
              await placeOrderAfterPayment(paymentResponse);

            setSuccess({
              ...orderResult,
              paymentId: paymentResponse.razorpay_payment_id,
              paymentStatus: "PAID",
            });

            setPaymentMessage("");

            // Clear only the checkout display.
            // The backend removes purchased cart rows only.
            setCart({
              items: [],
              subtotal: 0,
              total: 0,
            });

            window.dispatchEvent(new Event("cartUpdated"));
          } catch (err) {
            setError(
              err.message ||
                "We could not confirm your order. Contact support with your payment ID."
            );

            setPaymentMessage("");
          } finally {
            setPlacingOrder(false);
          }
        },

        prefill: {
          name: address.fullName,
          contact: address.phone,
        },

        notes: {
          userId: String(userId),
          pinCode: address.pinCode,
        },

        theme: {
          color: "#800000",
        },

        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
            setPaymentMessage("");
            setError("Payment was cancelled. You can try again.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setPlacingOrder(false);
        setPaymentMessage("");

        setError(
          response.error?.description ||
            "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (err) {
      setError(err.message || "Unable to start payment.");
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
      autoComplete: "name",
      maxLength: 100,
    },
    {
      name: "phone",
      label: "Mobile Number",
      placeholder: "10-digit mobile number",
      autoComplete: "tel",
      maxLength: 10,
    },
    {
      name: "addressLine",
      label: "House / Flat Number and Street",
      placeholder: "Enter house number, building and street",
      autoComplete: "address-line1",
      maxLength: 150,
    },
    {
      name: "area",
      label: "Area / Locality",
      placeholder: "Enter area or locality",
      autoComplete: "address-line2",
      maxLength: 100,
    },
    {
      name: "city",
      label: "City",
      placeholder: "Enter city",
      autoComplete: "address-level2",
      maxLength: 80,
    },
    {
      name: "state",
      label: "State",
      placeholder: "Enter state",
      autoComplete: "address-level1",
      maxLength: 80,
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
            Delivery & Payment
          </h2>

          <p className="mb-0" style={{ color: "#800000" }}>
            Confirm delivery availability, enter your address, and pay securely.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {paymentMessage && (
          <div className="alert alert-info" role="status">
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            ></span>
            {paymentMessage}
          </div>
        )}

        {success ? (
          <section className="bg-white p-4 p-md-5 text-center shadow-sm">
            <i
              className="bi bi-check-circle-fill display-2"
              style={{ color: "#198754" }}
            ></i>

            <h2 className="fw-bold mt-3 text-success">
              Payment Successful!
            </h2>

            <h4 className="fw-bold" style={{ color: "#800000" }}>
              Your Order Has Been Placed Successfully!
            </h4>

            <p className="text-secondary mt-3">
              Thank you for shopping with REYASA.
            </p>

            <div className="border rounded p-3 my-4 text-start">
              <p>
                <strong>Order ID:</strong>{" "}
                {success.orderId ?? "Confirmed"}
              </p>

              <p>
                <strong>Amount:</strong>{" "}
                {formatCurrency(success.totalAmount ?? checkoutTotal)}
              </p>

              <p>
                <strong>Order Status:</strong>{" "}
                {success.orderStatus || "PLACED"}
              </p>

              <p className="mb-0">
                <strong>Payment ID:</strong>{" "}
                {success.paymentId}
              </p>
            </div>

            <Link
              to="/collection"
              className="btn text-white px-4"
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
            <p className="mt-3">Loading your selected products...</p>
          </div>
        ) : (
          <div className="row g-4">
            {/* Delivery form */}
            <div className="col-12 col-lg-7">
              <form
                className="bg-white p-3 p-md-4 shadow-sm"
                onSubmit={handlePayNow}
              >
                <h5 className="fw-bold mb-3" style={{ color: "#800000" }}>
                  <span
                    className="badge me-2"
                    style={{ backgroundColor: "#800000" }}
                  >
                    1
                  </span>
                  Check Delivery Availability
                </h5>

                <label htmlFor="pinCode" className="form-label fw-semibold">
                  Delivery PIN Code *
                </label>

                <div className="row g-2">
                  <div className="col-12 col-sm-7">
                    <input
                      id="pinCode"
                      name="pinCode"
                      type="text"
                      className="form-control"
                      placeholder="Enter 6-digit PIN code"
                      value={address.pinCode}
                      onChange={handleChange}
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-5">
                    <button
                      type="button"
                      className="btn text-white w-100"
                      style={{ backgroundColor: "#800000" }}
                      onClick={checkDelivery}
                      disabled={
                        checkingDelivery ||
                        !/^\d{6}$/.test(address.pinCode.trim())
                      }
                    >
                      {checkingDelivery ? "Checking..." : "Check Delivery"}
                    </button>
                  </div>
                </div>

                {deliveryAvailability?.pinCode === address.pinCode.trim() &&
                  deliveryAvailability.available === true && (
                    <div className="alert alert-success mt-3">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      {deliveryAvailability.message ||
                        "Delivery is available at your location."}
                    </div>
                  )}

                {deliveryAvailability?.pinCode === address.pinCode.trim() &&
                  deliveryAvailability.available === false && (
                    <div className="mt-3">
                      <div className="alert alert-danger">
                        <i className="bi bi-exclamation-circle me-2"></i>
                        {deliveryAvailability.message ||
                          "Delivery is not available at this PIN code."}
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-danger w-100"
                        onClick={handleDeliveryEnquiry}
                      >
                        <i className="bi bi-envelope me-2"></i>
                        Enquire About Delivery
                      </button>
                    </div>
                  )}

                {/* Address appears only after successful PIN check */}
                {deliveryConfirmed && (
                  <div className="mt-4">
                    <hr />

                    <h5 className="fw-bold mb-4" style={{ color: "#800000" }}>
                      <span
                        className="badge me-2"
                        style={{ backgroundColor: "#800000" }}
                      >
                        2
                      </span>
                      Delivery Address
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
                            {field.label} *
                          </label>

                          <input
                            id={field.name}
                            name={field.name}
                            type="text"
                            className="form-control"
                            placeholder={field.placeholder}
                            value={address[field.name]}
                            onChange={handleChange}
                            autoComplete={field.autoComplete}
                            maxLength={field.maxLength}
                            required
                            inputMode={
                              field.name === "phone" ? "numeric" : undefined
                            }
                            pattern={
                              field.name === "phone"
                                ? "[0-9]{10}"
                                : undefined
                            }
                          />
                        </div>
                      ))}

                      <div className="col-12">
                        <label
                          htmlFor="landmark"
                          className="form-label fw-semibold"
                        >
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

                    <div className="mt-4 border rounded p-3">
                      <h5 className="fw-bold" style={{ color: "#800000" }}>
                        <i className="bi bi-shield-lock me-2"></i>
                        Secure Payment
                      </h5>

                      <p className="text-secondary small mb-3">
                        Pay securely using the Razorpay checkout window.
                      </p>

                      <button
                        type="submit"
                        className="btn text-white w-100 py-3"
                        style={{ backgroundColor: "#800000" }}
                        disabled={
                          placingOrder ||
                          checkingDelivery ||
                          !deliveryConfirmed ||
                          !cart.items?.length
                        }
                      >
                        {placingOrder ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              aria-hidden="true"
                            ></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-credit-card me-2"></i>
                            Pay Now — {formatCurrency(checkoutTotal)}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <Link
                  to="/cart"
                  className="btn btn-outline-secondary w-100 mt-3"
                >
                  Back to Cart
                </Link>
              </form>
            </div>

            {/* Selected products order summary */}
            <div className="col-12 col-lg-5">
              <section className="bg-white p-3 p-md-4 shadow-sm">
                <h5 className="fw-bold mb-3" style={{ color: "#800000" }}>
                  Selected Products ({cart.items.length})
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
                            {item.size ? `Size: ${item.size} · ` : ""}
                            Qty: {item.quantity}
                          </small>
                        </div>

                        <strong className="text-nowrap">
                          {formatCurrency(calculateItemTotal(item))}
                        </strong>
                      </div>
                    ))}

                    <div className="d-flex justify-content-between mt-3">
                      <span>Selected Products Subtotal</span>
                      <strong>{formatCurrency(checkoutSubtotal)}</strong>
                    </div>

                    <div className="d-flex justify-content-between mt-2">
                      <span>Delivery</span>
                      <strong className="text-success">FREE</strong>
                    </div>

                    <hr />

                    <div className="d-flex justify-content-between fs-5">
                      <strong>Total</strong>
                      <strong style={{ color: "#800000" }}>
                        {formatCurrency(checkoutTotal)}
                      </strong>
                    </div>

                    <p className="small text-secondary mt-3 mb-0">
                      Only the products selected on your Cart page are included
                      in this checkout.
                    </p>
                  </>
                ) : (
                  <p className="text-secondary mb-0">
                    No selected products found.{" "}
                    <Link to="/cart">Return to cart</Link>
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
