// src/components/post/PostItem.js
import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import {
  likePost,
  unlikePost,
  addComment,
  deletePost,
} from "../../services/api";
import { getCacheBustedUrl } from "../../utils/imageUtils";
import CommentItem from "./CommentItem";
import MediaLoader from "../common/MediaLoader";

const PostItem = ({ post, onPostDeleted }) => {
  const { currentUser } = useContext(AuthContext);
  const [postData, setPostData] = useState(post);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user has already liked the post
  const isLiked = postData.likes.some((like) => like === currentUser._id);

  const isOwner = postData?.user._id === currentUser._id;

  if (!postData) return null;

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Toggle like
  const handleLikeToggle = async () => {
    try {
      let updatedLikes;

      if (isLiked) {
        updatedLikes = await unlikePost(postData._id);
      } else {
        updatedLikes = await likePost(postData._id);
      }

      setPostData({ ...postData, likes: updatedLikes });
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    setSubmitting(true);

    try {
      const updatedComments = await addComment(postData._id, commentText);
      setPostData({ ...postData, comments: updatedComments });
      setCommentText("");
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete post
  const handleDeletePost = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      try {
        setIsDeleting(true);
        await deletePost(postData._id);

        // If callback function is provided (e.g. from parent component)
        if (onPostDeleted) {
          onPostDeleted(postData._id);
        } else {
          // If no callback, just hide the post locally
          setPostData(null);
        }
      } catch (err) {
        console.error("Error deleting post:", err);
        alert("Failed to delete post. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleMediaError = () => {
    setMediaError(true);
    console.error(`Failed to load media: ${postData.mediaUrl}`);
  };

  return (
    <div className="post-item">
      <div className="post-header">
        <div className="post-user">
          <Link to={`/profile/${postData.user._id}`}>
            <img
              src={getCacheBustedUrl(
                post.user._id === currentUser?._id
                  ? currentUser?.profilePicture
                  : post.user.profilePicture
              )}
              alt={post.user.username}
              className="avatar"
            />
            <span className="username">{postData.user.username}</span>
          </Link>
        </div>

        {postData.group && (
          <div className="post-group">
            <Link to={`/groups/${postData.group._id}`}>
              <span className="group-name">in {postData.group.name}</span>
            </Link>
          </div>
        )}

        <div className="post-date">{formatDate(postData.createdAt)}</div>
        {isOwner && (
          <button
            className="delete-post-btn"
            onClick={handleDeletePost}
            disabled={isDeleting}
            title="Delete post"
          >
            {isDeleting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-trash"></i>
            )}
          </button>
        )}
      </div>

      <div className="post-content">
        <p>{postData.text}</p>

        {postData.mediaType !== "none" && postData.mediaUrl && (
          <div className="post-media">
            {postData.mediaType === "image" ? (
              <img
                src={postData.mediaUrl}
                alt="Post attachment"
                onError={handleMediaError}
                className="post-image"
              />
            ) : postData.mediaType === "video" ? (
              <video controls className="post-video" onError={handleMediaError}>
                <source src={postData.mediaUrl} />
                Your browser does not support the video tag.
              </video>
            ) : postData.mediaType === "youtube" ? (
              <iframe
                src={postData.mediaUrl}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : null}
          </div>
        )}
      </div>

      <div className="post-actions">
        <button
          className={`action-button ${isLiked ? "liked" : ""}`}
          onClick={handleLikeToggle}
        >
          {isLiked ? (
            <i className="fas fa-heart" style={{ color: "red" }}></i>
          ) : (
            <i className="far fa-heart"></i>
          )}
          <span>{postData.likes.length}</span>
        </button>

        <button
          className={`action-button ${showComments ? "active" : ""}`}
          onClick={() => setShowComments(!showComments)}
        >
          {showComments ? (
            <i className="fas fa-comment" style={{ color: "#4267B2" }}></i>
          ) : (
            <i className="far fa-comment"></i>
          )}
          <span>{postData.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          <form onSubmit={handleAddComment} className="comment-form">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={submitting}
            />
            <button type="submit" disabled={submitting || !commentText.trim()}>
              Post
            </button>
          </form>

          {postData.comments.length > 0 ? (
            <div className="comments-list">
              {postData.comments.map((comment) => (
                <CommentItem key={comment._id} comment={comment} />
              ))}
            </div>
          ) : (
            <p className="no-comments">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PostItem;
