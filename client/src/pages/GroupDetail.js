import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getGroupById,
  getGroupPosts,
  joinGroup,
  leaveGroup,
  getUserInvitations,
} from "../services/api";
import PostItem from "../components/post/PostItem";
import CreatePostForm from "../components/post/CreatePostForm";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import ToastNotification from "../components/ui/ToastNotification";

const GroupDetail = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [localPendingRequest, setLocalPendingRequest] = useState(false);
  const [hasPendingInvitation, setHasPendingInvitation] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const navigate = useNavigate();

  const isMember = group?.members.some(
    (member) => member.user._id === currentUser._id
  );

  const isAdmin = group?.admin._id === currentUser._id;

  const hasPendingRequest =
    localPendingRequest ||
    (group?.pendingRequests &&
      group.pendingRequests.some((request) => {
        const requestUserId =
          typeof request.user === "object" ? request.user._id : request.user;
        return requestUserId === currentUser._id;
      }));

  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      message,
      type,
    });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  useEffect(() => {
    const checkPendingInvitation = async () => {
      if (!currentUser || !group) return;

      try {
        const invitations = await getUserInvitations();

        const hasInvitation = invitations.some(
          (inv) => inv.group._id === group._id
        );
        setHasPendingInvitation(hasInvitation);
      } catch (error) {
        console.error("Error checking pending invitations:", error);
        setHasPendingInvitation(false);
      }
    };

    checkPendingInvitation();
  }, [currentUser, group]);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const groupData = await getGroupById(id);
        setGroup(groupData);

        if (groupData.restricted) {
          setError(
            groupData.message ||
              "This is a private group that you don't have access to. You need an invitation to view its contents."
          );
        } else {
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

  const handleJoinGroup = async () => {
    setIsJoining(true);

    try {
      const result = await joinGroup(id);
      setLocalPendingRequest(true);
      showToast(result.msg || "Join request sent to group admin", "success");

      const updatedGroup = await getGroupById(id);
      setGroup(updatedGroup);

      setError(null);
    } catch (err) {
      showToast("Error joining group. Please try again.", "error");
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  const handlePostCreated = (newPost) => {
    console.log("New post created in group:", newPost);
    setPosts((prevPosts) => [newPost, ...prevPosts]);
    setError(null);
  };

  const handlePostUpdated = (updatedPost) => {
    console.log("Post updated in group:", updatedPost);
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handlePostDeleted = (deletedPostId) => {
    console.log("Post deleted from group:", deletedPostId);
    setPosts((prevPosts) =>
      prevPosts.filter((post) => post._id !== deletedPostId)
    );
  };

  const handleLeaveGroupClick = () => {
    setShowLeaveModal(true);
  };

  const handleLeaveGroupConfirm = async () => {
    setIsLeavingGroup(true);

    try {
      await leaveGroup(id);
      setShowLeaveModal(false);
      showToast("You have successfully left the group.", "success");
      setTimeout(() => {
        navigate("/groups");
      }, 1500);
    } catch (err) {
      console.error("Error leaving group:", err);
      setIsLeavingGroup(false);

      if (
        err.response &&
        err.response.status === 400 &&
        err.response.data.msg &&
        err.response.data.msg.includes("Admin cannot leave")
      ) {
        setShowLeaveModal(false);
        showToast(err.response.data.msg, "error");
      } else {
        setShowLeaveModal(false);
        showToast("Error leaving group. Please try again.", "error");

        try {
          const updatedGroup = await getGroupById(id);
          const stillMember = updatedGroup.members.some(
            (member) => (member.user._id || member.user) === currentUser._id
          );

          if (!stillMember) {
            showToast("You have successfully left the group.", "success");
            setTimeout(() => {
              navigate("/groups");
            }, 1500);
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

  const handleLeaveGroupCancel = () => {
    setShowLeaveModal(false);
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

  const canRequestToJoin =
    !isMember && !hasPendingRequest && !hasPendingInvitation;

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
            <>
              {hasPendingRequest ? (
                <button className="btn btn-secondary" disabled>
                  Join Request Pending
                </button>
              ) : hasPendingInvitation ? (
                <div className="invitation-notice">
                  <button className="btn btn-info" disabled>
                    You have a pending invitation
                  </button>
                  <p className="invitation-text">
                    Check your{" "}
                    <Link to="/group-invitations">Group Invitations</Link> to
                    respond.
                  </p>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                >
                  {isJoining ? "Sending Request..." : "Request to Join"}
                </button>
              )}
            </>
          ) : (
            !isAdmin && (
              <button
                className="btn btn-outline danger"
                onClick={handleLeaveGroupClick}
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
          {isMember && (
            <CreatePostForm groupId={id} onPostCreated={handlePostCreated} />
          )}

          <h2>Posts</h2>

          {posts.length === 0 ? (
            <div className="empty-posts">
              <p>No posts in this group yet.</p>
              {isMember && <p>Be the first to post something!</p>}
            </div>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <PostItem
                  key={post._id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  onPostUpdated={handlePostUpdated}
                />
              ))}
            </div>
          )}
        </div>

        <div className="group-sidebar">
          <div className="sidebar-section">
            <h3>About</h3>
            <p>{group.description}</p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(group.createdAt).toLocaleDateString("en-GB")}
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
                <ul className="pending-requests-list"></ul>
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

      <ConfirmationModal
        isOpen={showLeaveModal}
        onClose={handleLeaveGroupCancel}
        onConfirm={handleLeaveGroupConfirm}
        title="Leave Group"
        message="Are you sure you want to leave this group? You will need to request to join again if you want to return."
        confirmText="Leave Group"
        cancelText="Cancel"
        confirmButtonClass="btn-danger"
        isLoading={isLeavingGroup}
      />

      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default GroupDetail;
