// src/pages/GroupDetail.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getGroupById,
  getGroupPosts,
  joinGroup,
  createPost,
} from "../services/api";
import PostItem from "../components/post/PostItem";
import CreatePostForm from "../components/post/CreatePostForm";

const GroupDetail = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  // Check if user is a member of the group
  const isMember = group?.members.some(
    (member) => member.user._id === currentUser._id
  );

  // Check if user is the admin of the group
  const isAdmin = group?.admin._id === currentUser._id;

  // Check if user has a pending join request
  const hasPendingRequest = group?.pendingRequests?.some(
    (request) => request.user === currentUser._id
  );

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Fetch group details
        const groupData = await getGroupById(id);
        setGroup(groupData);

        // Fetch group posts
        const postsData = await getGroupPosts(id);
        setPosts(postsData);

        setError(null);
      } catch (err) {
        setError("Error loading group. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id]);

  // Handle join group request
  const handleJoinGroup = async () => {
    setIsJoining(true);

    try {
      await joinGroup(id);

      // Refetch group to update membership status
      const updatedGroup = await getGroupById(id);
      setGroup(updatedGroup);

      setError(null);
    } catch (err) {
      setError("Error joining group. Please try again.");
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  // Handle create post in group
  const handleCreatePost = async (postData) => {
    try {
      const updatedPostData = {
        ...postData,
        group: id,
      };

      const newPost = await createPost(updatedPostData);
      setPosts([newPost, ...posts]);
      return true;
    } catch (err) {
      setError("Error creating post. Please try again.");
      console.error(err);
      return false;
    }
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(posts.filter((post) => post._id !== deletedPostId));
  };

  if (loading) {
    return <div className="loading">Loading group...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!group) {
    return <div className="not-found">Group not found</div>;
  }

  return (
    <div className="group-detail">
      <div className="group-header">
        <div className="group-header-info">
          <h1 className="group-name">{group.name}</h1>
          <p className="group-description">{group.description}</p>
          <div className="group-meta">
            <span className="group-members">
              <i className="fas fa-users"></i> {group.members.length} members
            </span>
            {group.isPrivate && (
              <span className="group-privacy">
                <i className="fas fa-lock"></i> Private
              </span>
            )}
          </div>
        </div>

        <div className="group-header-actions">
          {!isMember && !hasPendingRequest && (
            <button
              className="btn btn-primary"
              onClick={handleJoinGroup}
              disabled={isJoining}
            >
              {isJoining
                ? "Joining..."
                : group.isPrivate
                ? "Request to Join"
                : "Join Group"}
            </button>
          )}

          {hasPendingRequest && (
            <button className="btn btn-secondary" disabled>
              Join Request Pending
            </button>
          )}

          {isAdmin && (
            <Link to={`/groups/${id}/manage`} className="btn btn-outline">
              Manage Group
            </Link>
          )}
        </div>
      </div>

      <div className="group-content">
        <div className="group-posts">
          {isMember && <CreatePostForm onCreatePost={handleCreatePost} />}

          <h2>Posts</h2>

          {posts.length === 0 ? (
            <div className="empty-posts">
              <p>No posts in this group yet.</p>
              {isMember && <p>Be the first to post something!</p>}
            </div>
          ) : (
            posts.map((post) => (
              <PostItem
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))
          )}
        </div>

        <div className="group-sidebar">
          <div className="sidebar-section">
            <h3>About</h3>
            <p>{group.description}</p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(group.createdAt).toLocaleDateString()}
            </p>
            <p>
              <strong>Admin:</strong> {group.admin.username}
            </p>
          </div>

          {isAdmin &&
            group.pendingRequests &&
            group.pendingRequests.length > 0 && (
              <div className="sidebar-section">
                <h3>Pending Requests</h3>
                <ul className="pending-requests-list">
                  {/* Render pending requests here */}
                </ul>
              </div>
            )}

          <div className="sidebar-section">
            <h3>Members</h3>
            <ul className="members-list">
              {group.members.slice(0, 5).map((member) => (
                <li key={member.user._id} className="member-item">
                  <Link to={`/profile/${member.user._id}`}>
                    <img
                      src={member.user.profilePicture || "/default-avatar.png"}
                      alt={member.user.username}
                      className="avatar small"
                    />
                    <span>{member.user.username}</span>
                  </Link>
                </li>
              ))}
              {group.members.length > 5 && (
                <li className="view-all">
                  <Link to={`/groups/${id}/members`}>View all members</Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
