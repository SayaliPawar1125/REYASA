
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heroBackground from '../assets/reyasa-background.png';
import AuthService from '../services/AuthService';

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));

    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      setLoading(true);

      const response = await AuthService.login({
        email: formData.email.trim(),
        password: formData.password
      });

      const data = response.data;

      localStorage.setItem('token', data.token);
      window.dispatchEvent(new Event("authChanged"));
      localStorage.setItem('userId', data.id);
      localStorage.setItem('firstname', data.firstName || '');
      localStorage.setItem('lastname', data.lastName || '');
      localStorage.setItem(
        'username',
        data.email || formData.email.trim()
      );
      localStorage.setItem('role', data.role);

      if (data.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }

    } catch (error) {
      console.error('Login error:', error);

      const status = error.response?.status;
      const responseData = error.response?.data;

      const message =
        typeof responseData === 'string'
          ? responseData
          : responseData?.message ||
            responseData?.detail ||
            responseData?.error ||
            '';

      const normalizedMessage = message.toLowerCase();

      if (
        status === 404 ||
        normalizedMessage.includes('account not found') ||
        normalizedMessage.includes('not registered')
      ) {
        setErrorMessage(
          'Account not found. Please create an account first.'
        );
      } else if (status === 401) {
        setErrorMessage('Invalid email or password. Please try again.');
      } else if (status === 403) {
        setErrorMessage(message || 'Your account is inactive.');
      } else {
        setErrorMessage(
          message || 'Login failed. Please try again later.'
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="min-vh-100 d-flex align-items-center py-5"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">

            <div
              className="card border-0 shadow-lg rounded-4 text-white"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}
            >
              <div className="card-body p-4 p-md-5">

                <div className="text-center mb-4">
                  <h3 className="text-white mt-3">Login</h3>
                </div>

                <form onSubmit={handleSubmit}>

                  {/* EMAIL */}
                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label text-white"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      className="form-control bg-transparent text-white border-light"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className="mb-3">
                    <label
                      htmlFor="password"
                      className="form-label text-white"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      name="password"
                      className="form-control bg-transparent text-white border-light"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  {/* FORGOT PASSWORD */}
                  <div className="text-center mb-4">
                    <Link
                      to="/forgot-password"
                      className="text-white-50 small text-decoration-none"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* ERROR MESSAGE */}
                  {errorMessage && (
                    <div
                      className="alert alert-danger py-2"
                      role="alert"
                    >
                      {errorMessage}
                    </div>
                  )}

                  {/* LOGIN BUTTON */}
                  <button
                    type="submit"
                    className="btn btn-light w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>
                        Logging in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        LOGIN
                      </>
                    )}
                  </button>

                </form>

                {/* REGISTER LINK */}
                <div className="text-center mt-4">
                  <p className="text-white-50 mb-2">
                    Don't have a REYASA account?
                  </p>

                  <Link
                    to="/register"
                    className="text-white fw-semibold"
                  >
                    Create Account
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
