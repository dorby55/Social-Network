// src/components/post/CommentItem.js
import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { getCacheBustedUrl } from "../../utils/imageUtils";
import { updateComment, deleteComment } from "../../services/api";

const CommentItem = ({
  comment,
  postId,
  onCommentUpdated,
  onCommentDeleted,
}) => {
  const { currentUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if this is the user's comment
  const isOwner = comment.user._id === currentUser?._id;

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Start editing
  const handleEditStart = () => {
    setIsEditing(true);
    setEditText(comment.text);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText(comment.text);
  };

  // Save edit
  const handleEditSave = async () => {
    if (!editText.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    if (editText.trim() === comment.text) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);

    try {
      const updatedComments = await updateComment(postId, comment._id, {
        text: editText.trim(),
      });

      setIsEditing(false);

      if (onCommentUpdated) {
        onCommentUpdated(updatedComments);
      }
    } catch (err) {
      console.error("Error updating comment:", err);
      alert("Failed to update comment. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete comment
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteComment(postId, comment._id);

      if (onCommentDeleted) {
        onCommentDeleted(comment._id);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
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
          <span className="comment-date">
            {formatDate(comment.createdAt || comment.date)}
            {comment.editedAt && (
              <span className="edited-indicator"> (edited)</span>
            )}
          </span>
        </div>

        {isOwner && !isEditing && (
          <div className="comment-owner-actions">
            <button
              className="edit-comment-btn"
              onClick={handleEditStart}
              disabled={isDeleting}
              title="Edit comment"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              className="delete-comment-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete comment"
            >
              {isDeleting ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-trash"></i>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="comment-content">
        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength="500"
              rows="2"
              className="edit-comment-textarea"
              disabled={isUpdating}
              placeholder="Edit your comment..."
            />
            <div className="edit-comment-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleEditSave}
                disabled={isUpdating || !editText.trim()}
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleEditCancel}
                disabled={isUpdating}
              >
                Cancel
              </button>
            </div>
            <small className="character-count">
              {editText.length}/500 characters
            </small>
          </div>
        ) : (
          <div className="comment-text">{comment.text}</div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
