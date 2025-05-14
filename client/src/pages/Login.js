// src/pages/Login.js
import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");

  const { isAuthenticated, login, error } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Display auth error
  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!email || !password) {
      setFormError("Please enter all fields");
      return;
    }

    // Attempt login
    const success = await login(email, password);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Sign In</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {formError && <div className="alert alert-danger">{formError}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={onChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Sign In
          </button>
        </form>

        <p className="auth-redirect">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
