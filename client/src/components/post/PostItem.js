import { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import {
  likePost,
  unlikePost,
  addComment,
  deletePost,
  updatePost,
} from "../../services/api";
import { getCacheBustedUrl } from "../../utils/imageUtils";
import CommentItem from "./CommentItem";

const PostItem = ({ post, onPostDeleted, onPostUpdated }) => {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  const [postData, setPostData] = useState(post);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(postData.text);
  const [isUpdating, setIsUpdating] = useState(false);

  const isLiked = postData.likes.some((like) => like === currentUser._id);
  const isOwner = postData?.user._id === currentUser._id;

  // Debug logging
  console.log("PostItem - Current location:", location.pathname);
  console.log("PostItem - Post group data:", postData.group);

  // Check if we're already on this group's page
  const isOnGroupPage =
    postData.group && location.pathname === `/groups/${postData.group._id}`;

  console.log("PostItem - Is on group page:", isOnGroupPage);

  // Get group name with fallback
  const getGroupName = () => {
    if (!postData.group) return null;

    // If group is just an ID string, we don't have the name
    if (typeof postData.group === "string") {
      console.log("PostItem - Group is just an ID string:", postData.group);
      return "Group"; // Fallback name
    }

    // If group is an object but no name
    if (postData.group && !postData.group.name) {
      console.log("PostItem - Group object has no name:", postData.group);
      return "Group"; // Fallback name
    }

    return postData.group.name;
  };

  const groupName = getGroupName();
  console.log("PostItem - Final group name:", groupName);

  const linkifyText = (text) => {
    if (!text) return "";

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      const cleanUrl = url.replace(/[.,;:!?]+$/, "");
      const trailingPunctuation = url.substring(cleanUrl.length);

      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="post-link">${cleanUrl}</a>${trailingPunctuation}`;
    });
  };

  if (!postData) return null;

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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

  const handleCommentUpdated = (updatedComments) => {
    setPostData({ ...postData, comments: updatedComments });
  };

  const handleCommentDeleted = (commentId) => {
    const updatedComments = postData.comments.filter(
      (comment) => comment._id !== commentId
    );
    setPostData({ ...postData, comments: updatedComments });
  };

  const handleDeletePost = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      try {
        setIsDeleting(true);
        await deletePost(postData._id);

        if (onPostDeleted) {
          onPostDeleted(postData._id);
        } else {
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

  const handleEditStart = () => {
    setIsEditing(true);
    setEditText(postData.text);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText(postData.text);
  };

  const handleEditSave = async () => {
    if (!editText.trim()) {
      alert("Post content cannot be empty");
      return;
    }

    if (editText.trim() === postData.text) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);
      const updatedPost = await updatePost(postData._id, {
        content: editText.trim(),
      });
      setPostData(updatedPost);
      setIsEditing(false);

      if (onPostUpdated) {
        onPostUpdated(updatedPost);
      }
    } catch (err) {
      console.error("Error updating post:", err);
      alert("Failed to update post. Please try again.");
    } finally {
      setIsUpdating(false);
    }
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

        {postData.group && groupName && (
          <div className="post-group">
            {isOnGroupPage ? (
              // If we're already on this group's page, show it as non-clickable text
              <span className="group-name-current">in {groupName}</span>
            ) : (
              // If we're not on this group's page, show it as a clickable link
              <Link to={`/groups/${postData.group._id || postData.group}`}>
                <span className="group-name">in {groupName}</span>
              </Link>
            )}
          </div>
        )}

        <div className="post-date">
          {formatDate(postData.createdAt)}
          {postData.editedAt && (
            <span className="edited-indicator"> (edited)</span>
          )}
        </div>

        {isOwner && (
          <div className="post-owner-actions">
            <button
              className="edit-post-btn"
              onClick={handleEditStart}
              disabled={isDeleting || isUpdating}
              title="Edit post"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              className="delete-post-btn"
              onClick={handleDeletePost}
              disabled={isDeleting || isUpdating}
              title="Delete post"
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

      <div className="post-content">
        {isEditing ? (
          <div className="post-edit-form">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength="1000"
              rows="4"
              className="edit-textarea"
              disabled={isUpdating}
              placeholder="What's on your mind?"
            />
            <div className="edit-actions">
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
              {editText.length}/1000 characters
            </small>
          </div>
        ) : (
          <div>
            {postData.text && postData.text.trim() && (
              <div
                className="linkified-text"
                dangerouslySetInnerHTML={{ __html: linkifyText(postData.text) }}
              />
            )}
          </div>
        )}

        {!isEditing && postData.mediaType !== "none" && postData.mediaUrl && (
          <div className="post-media">
            {postData.mediaType === "image" ? (
              <img
                src={postData.mediaUrl}
                alt="Post attachment"
                className="post-image"
                onError={(e) => {
                  e.target.style.display = "none";
                  console.error("Failed to load image:", postData.mediaUrl);
                }}
              />
            ) : postData.mediaType === "video" ? (
              <video
                controls
                className="post-video"
                onError={(e) => {
                  e.target.style.display = "none";
                  console.error("Failed to load video:", postData.mediaUrl);
                }}
              >
                <source src={postData.mediaUrl} />
                Your browser does not support the video tag.
              </video>
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
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  postId={postData._id}
                  onCommentUpdated={handleCommentUpdated}
                  onCommentDeleted={handleCommentDeleted}
                />
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
