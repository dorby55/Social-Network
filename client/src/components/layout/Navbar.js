import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { getCacheBustedUrl } from "../../utils/imageUtils";
import { useClickOutside } from "../../hooks/useClickOutside";
import NotificationBadge from "../ui/NotificationBadge";
import { useMessageNotifications } from "../../hooks/useMessageNotifications";
import { useFriendRequestNotifications } from "../../hooks/useFriendRequestNotifications";
import { useGroupInvitationNotifications } from "../../hooks/useGroupInvitationNotifications";

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const { count: messageCount } = useMessageNotifications();
  const { count: friendRequestCount } = useFriendRequestNotifications();
  const { count: groupInvitationCount } = useGroupInvitationNotifications();

  const dropdownRef = useClickOutside(() => {
    setShowUserMenu(false);
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/login");
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMessagesClick = () => {};

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
              <NotificationBadge count={messageCount}>
                <Link
                  to="/chat"
                  className="nav-link"
                  onClick={handleMessagesClick}
                >
                  Messages
                </Link>
              </NotificationBadge>
              <NotificationBadge count={friendRequestCount}>
                <Link to="/friend-requests" className="nav-link">
                  Friend Requests
                </Link>
              </NotificationBadge>
              <NotificationBadge count={groupInvitationCount}>
                <Link to="/group-invitations" className="nav-link">
                  Group Invitations
                </Link>
              </NotificationBadge>
              <Link to="/statistics" className="nav-link">
                Stats
              </Link>

              <div className="navbar-user-dropdown" ref={dropdownRef}>
                <button
                  className="user-menu-trigger"
                  onClick={toggleUserMenu}
                  aria-label="User menu"
                >
                  <img
                    src={getCacheBustedUrl(currentUser?.profilePicture)}
                    alt={currentUser?.username}
                    className="avatar"
                  />
                  <span className="username-text">{currentUser.username}</span>
                  <i
                    className={`fas fa-chevron-${
                      showUserMenu ? "up" : "down"
                    } dropdown-arrow`}
                  ></i>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <Link
                      to={`/profile/${currentUser._id}`}
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-user"></i>
                      My Profile
                    </Link>
                    <Link
                      to="/profile/edit"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-edit"></i>
                      Edit Profile
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button
                      onClick={handleLogout}
                      className="dropdown-item logout-item"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
