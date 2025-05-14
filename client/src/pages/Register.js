// src/pages/Register.js
import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [formError, setFormError] = useState("");

  const { isAuthenticated, register, error } = useContext(AuthContext);
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

  const { username, email, password, password2 } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!username || !email || !password) {
      setFormError("Please enter all fields");
      return;
    }

    if (password !== password2) {
      setFormError("Passwords do not match");
      return;
    }

    // Attempt register
    const userData = { username, email, password };
    const success = await register(userData);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Sign Up</h1>
        <p className="auth-subtitle">Create your account</p>

        {formError && <div className="alert alert-danger">{formError}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              value={username}
              onChange={onChange}
              placeholder="Enter your username"
              required
            />
          </div>

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

          <div className="form-group">
            <label htmlFor="password2">Confirm Password</label>
            <input
              type="password"
              name="password2"
              id="password2"
              value={password2}
              onChange={onChange}
              placeholder="Confirm your password"
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Sign Up
          </button>
        </form>

        <p className="auth-redirect">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
