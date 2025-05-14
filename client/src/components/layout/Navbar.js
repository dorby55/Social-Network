// src/components/layout/Navbar.js
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { getCacheBustedUrl } from "../../utils/imageUtils";
import MessageNotification from "../chat/MessageNotification";

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          Social Network
        </Link>

        {isAuthenticated && (
          <div className="navbar-search">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search users, groups, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-button">
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>
        )}

        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/groups" className="nav-link">
                Groups
              </Link>
              <Link to="/chat" className="nav-link">
                Messages
              </Link>
              <Link to="/friend-requests" className="nav-link">
                Friend Requests
                {/* You could add a badge here to show the number of pending requests */}
              </Link>
              <Link to="/statistics" className="nav-link">
                Stats
              </Link>
              <Link to="/media" className="nav-link">
                Media
              </Link>
              <MessageNotification />
              {isAuthenticated && currentUser && (
                <div className="navbar-user">
                  <Link to={`/profile/${currentUser._id}`}>
                    <img
                      src={getCacheBustedUrl(currentUser?.profilePicture)}
                      alt={currentUser?.username}
                      className="avatar"
                    />
                    <span>{currentUser.username}</span>
                  </Link>
                  <button onClick={handleLogout} className="nav-link">
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
