// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token in headers for all requests
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common["x-auth-token"] = token;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["x-auth-token"];
      localStorage.removeItem("token");
    }
  };

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          // Check if token is expired
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp < currentTime) {
            // Token expired
            setAuthToken(null);
            setCurrentUser(null);
            setIsAuthenticated(false);
            setError("Session expired, please login again");
          } else {
            // Token valid
            setAuthToken(token);

            try {
              const res = await axios.get("http://localhost:5000/api/users/me");
              setCurrentUser(res.data);
              setIsAuthenticated(true);
              setError(null);
            } catch (err) {
              setAuthToken(null);
              setCurrentUser(null);
              setIsAuthenticated(false);
              setError("Session invalid, please login again");
            }
          }
        } catch (err) {
          setAuthToken(null);
          setCurrentUser(null);
          setIsAuthenticated(false);
          setError("Invalid token");
        }
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      const res = await axios.post("http://localhost:5000/api/users", userData);
      setAuthToken(res.data.token);

      // Load user data
      const userRes = await axios.get("http://localhost:5000/api/users/me");
      setCurrentUser(userRes.data);
      setIsAuthenticated(true);
      setError(null);

      return true;
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
      return false;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/users/login", {
        email,
        password,
      });
      setAuthToken(res.data.token);

      // Load user data
      const userRes = await axios.get("http://localhost:5000/api/users/me");
      setCurrentUser(userRes.data);
      setIsAuthenticated(true);
      setError(null);

      return true;
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
      return false;
    }
  };

  // Logout user
  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const updateProfilePicture = (newProfilePictureUrl) => {
    if (currentUser) {
      // Update the currentUser object with the new profile picture
      setCurrentUser({
        ...currentUser,
        profilePicture: newProfilePictureUrl,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfilePicture,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
