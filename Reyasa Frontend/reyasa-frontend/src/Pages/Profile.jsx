import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import heroBackground from "../assets/reyasa-background.png";

import UserService from "../services/UserService";

 

function Profile() {

  const navigate = useNavigate();

 

  const [profile, setProfile] = useState({

    firstName: "",

    lastName: "",

    email: "",

    phone: "",

    purchaseCount: 0,

    discount: 0,

  });

 

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

 

  useEffect(() => {

    const token = localStorage.getItem("token");

 

    if (!token) {

      navigate("/login");

      return;

    }

 

    const fetchProfile = async () => {

      try {

        const response = await UserService.getCurrentUser();

        const user = response.data;

 

        const fullName = user.name || user.fullName || "";

        const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

 

        setProfile({

          firstName:

            user.firstName || user.firstname || nameParts[0] || "",

          lastName:

            user.lastName ||

            user.lastname ||

            nameParts.slice(1).join(" ") ||

            "",

          email: user.email || "",

          phone: user.phone || user.phoneNumber || "",

          purchaseCount: user.purchaseCount ?? 0,

          discount: user.discount ?? 0,

        });

      } catch (err) {

        console.error("Profile API error:", err);

 

        if (

          err.response?.status === 401 ||

          err.response?.status === 403

        ) {

          setError("Your session has expired. Please log in again.");

        } else {

          setError(

            err.response?.data?.message ||

              "Unable to load your profile. Please try again."

          );

        }

      } finally {

        setLoading(false);

      }

    };

 

    fetchProfile();

  }, [navigate]);

 

  const handleLogout = () => {

    [

      "token",

      "userId",

      "firstname",

      "lastname",

      "username",

      "role",

    ].forEach((key) => localStorage.removeItem(key));

 

    navigate("/login");

  };

 

  if (loading) {

    return (

      <div className="container py-5 mt-5 text-center">

        <div className="spinner-border" role="status">

          <span className="visually-hidden">Loading...</span>

        </div>

        <p className="mt-3">Loading your profile...</p>

      </div>

    );

  }

 

  const customer = {

    name: `${profile.firstName} ${profile.lastName}`.trim(),

    email: profile.email,

    phone: profile.phone,

    purchaseCount: profile.purchaseCount,

    discount: profile.discount,

  };

 

  return (

    <div

      className="bg-light min-vh-100"

      style={{ paddingTop: "10px" }}

    >

      <section

        className="py-5"

        style={{

          backgroundImage: `url(${heroBackground})`,

          backgroundSize: "cover",

          backgroundPosition: "center",

          backgroundRepeat: "no-repeat",

          minHeight: "calc(100vh - 90px)",

        }}

      >

        <div className="container">

          {/* PAGE HEADING */}

          <div className="text-center mb-5">

            <i className="bi bi-person-circle display-4 text-white opacity-75"></i>

 

            <h1 className="mt-3 fw-semibold" style={{ color: "#800000" }}>

              My Profile

            </h1>

 

            <p style={{ color: "#800000" }}>

              Welcome back to REYASA

            </p>

          </div>

 

          {error && (

            <div

              className="alert alert-danger text-center"

              role="alert"

            >

              {error}

 

              <div className="mt-3">

                <button

                  className="btn btn-dark me-2"

                  onClick={() => window.location.reload()}

                >

                  Try Again

                </button>

 

                <button

                  className="btn btn-outline-dark"

                  onClick={handleLogout}

                >

                  Login Again

                </button>

              </div>

            </div>

          )}

 

          {!error && (

            <div className="row g-4 justify-content-center">

              {/* CUSTOMER INFORMATION */}

              <div className="col-12 col-lg-5">

                <div

                  className="card border-0 shadow-lg rounded-4 h-100 text-white"

                  style={{

                    backgroundColor: "rgba(0, 0, 0, 0.45)",

                    backdropFilter: "blur(8px)",

                    WebkitBackdropFilter: "blur(8px)",

                  }}

                >

                  <div className="card-body p-4 p-md-5">

                    {/* PROFILE ICON */}

                    <div className="text-center mb-4">

                      <div

                        className="rounded-circle bg-light text-dark d-flex align-items-center justify-content-center mx-auto"

                        style={{

                          width: "90px",

                          height: "90px",

                          fontSize: "35px",

                        }}

                      >

                        <i className="bi bi-person"></i>

                      </div>

 

                      <h3 className="mt-3 mb-1 text-white">

                        {customer.name || "REYASA Customer"}

                      </h3>

                    </div>

 

                    <hr className="border-light opacity-25" />

 

                    {/* EMAIL */}

                    <div className="d-flex align-items-center mb-4">

                      <i className="bi bi-envelope fs-4 me-3 text-white-50"></i>

 

                      <div>

                        <small className="text-white-50 d-block">

                          Email

                        </small>

 

                        <div className="text-white text-break">

                          {customer.email || "Not available"}

                        </div>

                      </div>

                    </div>

 

                    {/* PHONE */}

                    <div className="d-flex align-items-center mb-4">

                      <i className="bi bi-telephone fs-4 me-3 text-white-50"></i>

 

                      <div>

                        <small className="text-white-50 d-block">

                          Mobile Number

                        </small>

 

                        <div className="text-white">

                          {customer.phone || "Not available"}

                        </div>

                      </div>

                    </div>

 

                    {/* FIRST NAME */}

                    <div className="d-flex align-items-center mb-4">

                      <i className="bi bi-person fs-4 me-3 text-white-50"></i>

 

                      <div>

                        <small className="text-white-50 d-block">

                          First Name

                        </small>

 

                        <div className="text-white">

                          {profile.firstName || "Not available"}

                        </div>

                      </div>

                    </div>

 

                    {/* LAST NAME */}

                    <div className="d-flex align-items-center">

                      <i className="bi bi-person-badge fs-4 me-3 text-white-50"></i>

 

                      <div>

                        <small className="text-white-50 d-block">

                          Last Name

                        </small>

 

                        <div className="text-white">

                          {profile.lastName || "Not available"}

                        </div>

                      </div>

                    </div>

 

                    {/* LOGOUT */}

                    <div className="d-grid mt-4">

                      <button

                        type="button"

                        className="btn btn-outline-light"

                        onClick={handleLogout}

                      >

                        <i className="bi bi-box-arrow-right me-2"></i>

                        Logout

                      </button>

                    </div>

                  </div>

                </div>

              </div>

 

              {/* LOYALTY CARD */}

              <div className="col-12 col-lg-5">

                <div

                  className="card border-0 shadow-lg rounded-4 h-100 text-white"

                  style={{

                    backgroundColor: "rgba(0, 0, 0, 0.45)",

                    backdropFilter: "blur(8px)",

                    WebkitBackdropFilter: "blur(8px)",

                  }}

                >

                  <div className="card-body p-4 p-md-5">

                    <div className="text-center">

                      <i className="bi bi-stars display-5 text-warning"></i>

 

                      <h3 className="mt-3 text-white">

                        Your REYASA Journey

                      </h3>

                    </div>

 

                    {/* STATS */}

                    <div className="row text-center g-3 mt-4">

                      {/* PURCHASE COUNT */}

                      <div className="col-6">

                        <div

                          className="rounded-4 p-4"

                          style={{

                            backgroundColor: "rgba(255,255,255,0.10)",

                          }}

                        >

                          <h2 className="mb-1 text-white fw-bold">

                            {customer.purchaseCount}

                          </h2>

 

                          <small className="text-white-50">

                            Shirts Purchased

                          </small>

                        </div>

                      </div>

 

                      {/* DISCOUNT */}

                      <div className="col-6">

                        <div

                          className="rounded-4 p-4"

                          style={{

                            backgroundColor: "rgba(255,255,255,0.10)",

                          }}

                        >

                          <h2 className="mb-1 text-white fw-bold">

                            {customer.discount}%

                          </h2>

 

                          <small className="text-white-50">

                            Next Purchase Discount

                          </small>

                        </div>

                      </div>

                    </div>

 

                    {/* THANK YOU */}

                    <div

                      className="alert border-0 text-white text-center mt-4"

                      style={{

                        backgroundColor: "rgba(255,255,255,0.10)",

                      }}

                    >

                      <i className="bi bi-heart-fill me-2 text-danger"></i>

                      Thank you for being a part of REYASA.

                    </div>

 

                    {/* PROGRESS */}

                    <div className="mt-4">

                      <div className="d-flex justify-content-between text-white-50 small">

                        <span>Loyalty Progress</span>

 

                        <span>

                          {customer.purchaseCount} Purchases

                        </span>

                      </div>

 

                      <div

                        className="progress mt-2"

                        style={{

                          height: "10px",

                          backgroundColor: "rgba(255,255,255,0.20)",

                        }}

                      >

                        <div

                          className="progress-bar bg-white"

                          style={{

                            width: `${Math.min(

                              customer.purchaseCount * 25,

                              100

                            )}%`,

                          }}

                        ></div>

                      </div>

                    </div>

 

                    {/* MESSAGE */}

                    <div className="text-center mt-4">

                      <small className="text-white-50">

                        Keep shopping to unlock your next REYASA benefit.

                      </small>

                    </div>

 

                    {/* CONTINUE SHOPPING */}

                    <div className="d-grid mt-4">

                      <button

                        type="button"

                        className="btn btn-light"

                        onClick={() => navigate("/collection")}

                      >

                        Continue Shopping

                      </button>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          )}

        </div>

      </section>

    </div>

  );

}

 

export default Profile;