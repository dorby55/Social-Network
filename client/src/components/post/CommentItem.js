// src/components/post/CommentItem.js
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { getCacheBustedUrl } from "../../utils/imageUtils";

const CommentItem = ({ comment }) => {
  const { currentUser } = useContext(AuthContext);
  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="comment-item">
      <div className="comment-user">
        <Link to={`/profile/${comment.user._id}`}>
          <img
            src={getCacheBustedUrl(
              comment.user._id === currentUser?._id
                ? currentUser?.profilePicture
                : comment.user.profilePicture
            )}
            alt={comment.user.username}
            className="avatar small"
          />
          <span className="username">{comment.user.username}</span>
        </Link>
        <span className="comment-date">{formatDate(comment.date)}</span>
      </div>
      <div className="comment-text">{comment.text}</div>
    </div>
  );
};

export default CommentItem;
