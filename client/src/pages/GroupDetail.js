// src/pages/GroupDetail.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getGroupById,
  getGroupPosts,
  joinGroup,
  createPost,
  leaveGroup,
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
  const [localPendingRequest, setLocalPendingRequest] = useState(false);

  const navigate = useNavigate();

  // Check if user is a member of the group
  const isMember = group?.members.some(
    (member) => member.user._id === currentUser._id
  );

  // Check if user is the admin of the group
  const isAdmin = group?.admin._id === currentUser._id;

  // Check if user has a pending join request
  const hasPendingRequest =
    localPendingRequest ||
    (group?.pendingRequests &&
      group.pendingRequests.some((request) => {
        // Check different formats of user data in the pending request
        const requestUserId =
          typeof request.user === "object" ? request.user._id : request.user;
        return requestUserId === currentUser._id;
      }));

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Fetch group details
        const groupData = await getGroupById(id);
        setGroup(groupData);

        // If the group is restricted, show appropriate message
        if (groupData.restricted) {
          setError(
            groupData.message ||
              "This is a private group that you don't have access to. You need an invitation to view its contents."
          );
        } else {
          // Fetch group posts if we have access
          const postsData = await getGroupPosts(id);
          setPosts(postsData);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching group:", err);
        if (err.response && err.response.status === 404) {
          setError("Group not found.");
        } else if (err.response && err.response.status === 403) {
          setError(
            "You don't have permission to view this group. You must be a member to access it."
          );
        } else {
          setError("Error loading group. Please try again.");
        }
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
      const result = await joinGroup(id);
      setLocalPendingRequest(true);
      alert(result.msg || "Join request sent to group admin");

      // Refetch group to update the UI
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

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) {
      return;
    }

    try {
      await leaveGroup(id);
      // Success! Redirect to groups page
      navigate("/groups"); // <-- Changed from Navigate to navigate
    } catch (err) {
      console.error("Error leaving group:", err);

      // Check if it's a 400 error with the admin message (which is expected if admin tries to leave)
      if (
        err.response &&
        err.response.status === 400 &&
        err.response.data.msg &&
        err.response.data.msg.includes("Admin cannot leave")
      ) {
        setError(err.response.data.msg);
      } else {
        // If it's a different error, show general error message
        setError("Error leaving group. Please try again.");

        // Check if the user was actually removed despite the error
        try {
          // Fetch the group again to see if user is still a member
          const updatedGroup = await getGroupById(id);
          const stillMember = updatedGroup.members.some(
            (member) => (member.user._id || member.user) === currentUser._id
          );

          if (!stillMember) {
            // User was successfully removed, redirect
            alert("You have successfully left the group.");
            navigate("/groups"); // <-- Changed from Navigate to navigate
          }
        } catch (checkErr) {
          console.error(
            "Error checking group membership after leave:",
            checkErr
          );
        }
      }
    }
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

  if (group && group.restricted) {
    return (
      <div className="restricted-group">
        <div className="card">
          <div className="card-header">
            <h1>{group.name}</h1>
            {group.isPrivate && (
              <span className="private-badge">
                <i className="fas fa-lock"></i> Private Group
              </span>
            )}
          </div>
          <div className="card-body">
            <div className="restricted-message">
              <i className="fas fa-lock restricted-icon"></i>
              <p>
                This is a private group. You need to be a member to view its
                contents.
              </p>
              <p>If you've been invited, please check your invitations.</p>
              <div className="restricted-actions">
                <Link to="/groups" className="btn btn-primary">
                  Browse Groups
                </Link>
                <Link to="/group-invitations" className="btn btn-outline">
                  Check Invitations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
          {!isMember ? (
            hasPendingRequest ? (
              <button className="btn btn-secondary" disabled>
                Join Request Pending
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleJoinGroup}
                disabled={isJoining}
              >
                {isJoining ? "Sending Request..." : "Request to Join"}
              </button>
            )
          ) : (
            !isAdmin && (
              <button
                className="btn btn-outline danger"
                onClick={handleLeaveGroup}
              >
                Leave Group
              </button>
            )
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
