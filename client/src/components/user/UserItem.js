import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { getCacheBustedUrl } from "../../utils/imageUtils";

const UserItem = ({ user }) => {
  const { currentUser } = useContext(AuthContext);
  return (
    <div className="user-item">
      <Link to={`/profile/${user._id}`} className="user-link">
        <img
          src={getCacheBustedUrl(
            user._id === currentUser?._id
              ? currentUser?.profilePicture
              : user.profilePicture
          )}
          alt={user.username}
          className="user-avatar"
        />
        <div className="user-info">
          <h3 className="user-name">{user.username}</h3>
          <p className="user-bio">{user.bio || "No bio available"}</p>
        </div>
      </Link>
    </div>
  );
};

export default UserItem;
