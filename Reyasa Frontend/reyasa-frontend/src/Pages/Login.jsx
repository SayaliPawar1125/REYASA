
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

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
  const [showPassword, setShowPassword] = useState(false);

  // Save login details and redirect
  const completeLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.id);
    localStorage.setItem('firstname', data.firstName || '');
    localStorage.setItem('lastname', data.lastName || '');
    localStorage.setItem(
      'username',
      data.email || formData.email.trim()
    );
    localStorage.setItem('role', data.role);

    window.dispatchEvent(new Event('authChanged'));

    if (data.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/profile', { replace: true });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));

    setErrorMessage('');
  };

  // Existing email and password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      setLoading(true);

      const response = await AuthService.login({
        email: formData.email.trim(),
        password: formData.password
      });

      completeLogin(response.data);

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

  // Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMessage('');

    if (!credentialResponse.credential) {
      setErrorMessage('Google login failed. Please try again.');
      return;
    }

    try {
      setLoading(true);

      // Backend verifies the Google ID token
      const response = await AuthService.googleLogin({
        credential: credentialResponse.credential
      });

      completeLogin(response.data);

    } catch (error) {
      console.error('Google login error:', error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Google login failed. Please try again.';

      setErrorMessage(message);

    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMessage('Google sign-in was unsuccessful. Please try again.');
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

                {/* GOOGLE LOGIN */}
                <div className="d-flex justify-content-center mb-3">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    shape="rectangular"
                    size="large"
                    text="continue_with"
                    width="300"
                  />
                </div>

                {/* OR DIVIDER */}
                <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1 border-light" />
                  <span className="text-white-50 px-3 small">OR</span>
                  <hr className="flex-grow-1 border-light" />
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

                    <div className="input-group">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="form-control bg-transparent text-white border-light"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                      />

                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() =>
                          setShowPassword((previous) => !previous)
                        }
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        <i
                          className={`bi ${
                            showPassword ? 'bi-eye-slash' : 'bi-eye'
                          }`}
                        ></i>
                      </button>
                    </div>
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
