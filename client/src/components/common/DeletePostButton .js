import React, { useState } from "react";
import axios from "axios";

const DeletePostButton = ({ postId, onPostDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      try {
        setIsDeleting(true);
        await axios.delete(`/api/posts/${postId}`);
        setIsDeleting(false);
        // Call callback to update UI
        onPostDeleted(postId);
      } catch (err) {
        console.error("Error deleting post:", err);
        setIsDeleting(false);
        alert("Failed to delete post. Please try again.");
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="delete-post-btn"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
};

export default DeletePostButton;
