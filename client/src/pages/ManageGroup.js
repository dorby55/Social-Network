// src/pages/ManageGroup.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getGroupById,
  updateGroup,
  deleteGroup,
  inviteToGroup,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  searchUsers as searchUsersApi, // Rename to avoid conflict
} from "../services/api";

const ManageGroup = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [group, setGroup] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  // Fetch group data on component mount
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const groupData = await getGroupById(id);
        console.log("Group data fetched:", groupData);

        setGroup(groupData);

        // Set form data from group
        setFormData({
          name: groupData.name,
          description: groupData.description,
          isPrivate: groupData.isPrivate || false,
        });

        if (
          groupData.pendingRequests &&
          Array.isArray(groupData.pendingRequests)
        ) {
          console.log("Setting pending requests:", groupData.pendingRequests);
          setPendingRequests(groupData.pendingRequests);
        } else {
          console.log(
            "No pending requests found or invalid format:",
            groupData.pendingRequests
          );
          setPendingRequests([]);
        }

        // Extract members if they exist
        if (groupData.members && Array.isArray(groupData.members)) {
          setMembers(groupData.members);
        }

        setError(null);
      } catch (err) {
        console.error("Error loading group:", err);
        setError("Error loading group. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id]);

  // Function to refresh group data
  const refreshGroupData = async () => {
    try {
      setLoading(true);
      console.log("Fetching updated group data...");
      const refreshedGroup = await getGroupById(id);
      console.log("Refreshed group data:", refreshedGroup);

      setGroup(refreshedGroup);
      setFormData({
        name: refreshedGroup.name,
        description: refreshedGroup.description,
        isPrivate: refreshedGroup.isPrivate || false,
      });

      // Check if pendingRequests exists and is an array
      if (
        refreshedGroup.pendingRequests &&
        Array.isArray(refreshedGroup.pendingRequests)
      ) {
        console.log(
          "Setting pending requests:",
          refreshedGroup.pendingRequests
        );
        setPendingRequests(refreshedGroup.pendingRequests);
      } else {
        console.log(
          "No pending requests found or invalid format:",
          refreshedGroup.pendingRequests
        );
        setPendingRequests([]);
      }

      // Update members
      if (refreshedGroup.members && Array.isArray(refreshedGroup.members)) {
        setMembers(refreshedGroup.members);
      }

      setError(null);
    } catch (err) {
      console.error("Error refreshing group data:", err);
      setError("Error loading group data. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  // Check if user is the admin
  const isAdmin =
    group?.admin?._id === currentUser?._id ||
    group?.admin === currentUser?._id ||
    group?.admin?.toString() === currentUser?._id?.toString();

  // Handle form input changes
  const onChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Handle form submission (update group)
  const handleUpdateGroup = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setError("You don't have permission to update this group");
      return;
    }

    setUpdating(true);

    try {
      // Make the API call to update the group
      const updatedGroup = await updateGroup(id, formData);

      // Log for debugging
      console.log("Group updated successfully:", updatedGroup);

      // Update both the form data and the group state
      setFormData({
        name: updatedGroup.name,
        description: updatedGroup.description,
        isPrivate: updatedGroup.isPrivate || false,
      });

      // Important: Make sure to update the full group object with all properties
      setGroup({
        ...group, // Keep any properties that might not be returned in the update
        ...updatedGroup, // Override with new properties
        admin: group.admin, // Explicitly preserve the admin object
      });

      setError(null);
      alert("Group updated successfully!");
    } catch (err) {
      console.error("Error updating group:", err);
      setError("Error updating group. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Handle group deletion
  const handleDeleteGroup = async () => {
    if (!isAdmin) {
      setError("You don't have permission to delete this group");
      return;
    }

    // Confirm deletion
    if (
      !window.confirm(
        "Are you sure you want to delete this group? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      await deleteGroup(id);
      navigate("/groups");
    } catch (err) {
      console.error("Error deleting group:", err);
      setError("Error deleting group. Please try again.");
      setDeleting(false);
    }
  };

  // Function to search for users (renamed to avoid conflict)
  const searchForUsers = async (term) => {
    if (!term || term.length < 2) return;

    setLoadingUsers(true);
    try {
      console.log("Searching for users with term:", term);
      const users = await searchUsersApi(term); // Use the renamed import
      console.log("Search results:", users);

      // Filter out users who are already members
      const filteredUsers = users.filter((user) => {
        // Skip if it's the current user (admin)
        if (user._id === currentUser._id) return false;

        // Check if user is already a member
        return !members.some((member) => {
          const memberId = member.user._id || member.user;
          return memberId === user._id;
        });
      });

      setAvailableUsers(filteredUsers);
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search for users");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle member request approval/rejection
  const handleMemberRequest = async (userId, action) => {
    try {
      if (action === "approve") {
        await approveJoinRequest(id, userId);
        // Remove the request from the local state immediately for better UI feedback
        setPendingRequests((prevRequests) =>
          prevRequests.filter(
            (req) =>
              (req.user._id && req.user._id !== userId) ||
              (typeof req.user === "string" && req.user !== userId)
          )
        );

        // Also refresh the full group data
        await refreshGroupData();

        // Provide user feedback
        alert(
          action === "approve"
            ? "User approved successfully!"
            : "Request rejected successfully!"
        );
      } else {
        await rejectJoinRequest(id, userId);
        // Remove the request from the local state immediately
        setPendingRequests((prevRequests) =>
          prevRequests.filter(
            (req) =>
              (req.user._id && req.user._id !== userId) ||
              (typeof req.user === "string" && req.user !== userId)
          )
        );
      }
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      setError(`Failed to ${action} request. Please try again.`);
    }
  };

  // Add function to invite a user
  const handleInviteUser = async () => {
    if (!selectedUser) {
      setError("Please select a user to invite");
      return;
    }

    setInviting(true);

    try {
      console.log(`Inviting user ${selectedUser} to group ${id}`);
      const result = await inviteToGroup(id, selectedUser);
      console.log("Invitation result:", result);

      // Clear search results and selection
      setUserSearchTerm("");
      setSelectedUser("");
      setAvailableUsers([]);

      // Show success message
      alert(result.msg || "User invited successfully!");

      // Refresh the group data
      await refreshGroupData();
    } catch (err) {
      console.error("Error inviting user:", err.response?.data || err);
      setError(
        err.response?.data?.msg || "Failed to invite user. Please try again."
      );
    } finally {
      setInviting(false);
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this member from the group?"
      )
    ) {
      return;
    }

    try {
      await removeMember(id, userId);

      // Update local state to remove the member
      setMembers((prevMembers) =>
        prevMembers.filter(
          (member) =>
            (member.user._id && member.user._id !== userId) ||
            (typeof member.user === "string" && member.user !== userId)
        )
      );

      alert("Member removed successfully!");
    } catch (err) {
      console.error("Error removing member:", err);
      setError("Failed to remove member. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading group details...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!group) {
    return <div className="not-found">Group not found</div>;
  }

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="not-authorized">
        <h2>Not Authorized</h2>
        <p>You don't have permission to manage this group.</p>
        <Link to={`/groups/${id}`} className="btn btn-primary">
          Back to Group
        </Link>
      </div>
    );
  }

  return (
    <div className="manage-group-page">
      <div className="page-header">
        <h1>Manage Group: {group.name}</h1>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={refreshGroupData}
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <Link to={`/groups/${id}`} className="btn btn-outline">
            Back to Group
          </Link>
        </div>
      </div>

      <div className="manage-group-content">
        <div className="card">
          <div className="card-header">
            <h2>Group Settings</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateGroup}>
              <div className="form-group">
                <label htmlFor="name">Group Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <div className="checkbox">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    name="isPrivate"
                    checked={formData.isPrivate}
                    onChange={onChange}
                  />
                  <label htmlFor="isPrivate">Private Group</label>
                </div>
                <small className="form-text">
                  Private groups are only visible to members and require admin
                  approval to join.
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Update Group"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Membership Requests Card */}
        <div className="card">
          <div className="card-header">
            <div className="header-with-actions">
              <h2>Membership Requests ({pendingRequests.length})</h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={refreshGroupData}
                disabled={loading}
                title="Refresh requests"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
          <div className="card-body">
            {pendingRequests.length > 0 ? (
              <div className="pending-requests-list">
                {pendingRequests.map((request) => {
                  // Get the user data, handling both populated and unpopulated cases
                  const userId = request.user._id || request.user;
                  const username =
                    request.user.username || `User ID: ${userId}`;

                  console.log("Rendering request:", {
                    request,
                    userId,
                    username,
                  });

                  return (
                    <div key={userId} className="pending-request-item">
                      <div className="request-user-info">
                        <span className="username">{username}</span>
                        <span className="request-date">
                          Requested:{" "}
                          {request.requestedAt
                            ? new Date(request.requestedAt).toLocaleDateString()
                            : "Unknown date"}
                        </span>
                      </div>
                      <div className="request-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleMemberRequest(userId, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleMemberRequest(userId, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No pending membership requests.</p>
            )}
          </div>
        </div>

        {/* Invite Users Card - New Section */}
        <div className="card">
          <div className="card-header">
            <h2>Invite Users</h2>
          </div>
          <div className="card-body">
            <div className="invite-user-form">
              <div className="form-group">
                <label htmlFor="userSearch">Search for users to invite</label>
                <div className="search-row">
                  <input
                    type="text"
                    id="userSearch"
                    value={userSearchTerm}
                    onChange={(e) => {
                      setUserSearchTerm(e.target.value);
                      if (e.target.value.length >= 2) {
                        searchForUsers(e.target.value); // Use renamed function
                      }
                    }}
                    placeholder="Type username to search (min 2 characters)..."
                  />
                  <button
                    className="btn btn-primary"
                    disabled={!selectedUser || inviting}
                    onClick={handleInviteUser}
                  >
                    {inviting ? "Inviting..." : "Invite"}
                  </button>
                </div>

                {loadingUsers && (
                  <div className="loading">Searching users...</div>
                )}

                {availableUsers.length > 0 && (
                  <div className="user-search-results">
                    {availableUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`user-search-item ${
                          selectedUser === user._id ? "selected" : ""
                        }`}
                        onClick={() => setSelectedUser(user._id)}
                      >
                        <img
                          src={user.profilePicture || "/default-avatar.png"}
                          alt={user.username}
                          className="avatar small"
                        />
                        <span>{user.username}</span>
                      </div>
                    ))}
                  </div>
                )}

                {availableUsers.length === 0 &&
                  userSearchTerm.length >= 2 &&
                  !loadingUsers && (
                    <p>No users found. Try a different search term.</p>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Members</h2>
          </div>
          <div className="card-body">
            {members.length > 0 ? (
              <div className="members-list">
                {members.map((member) => {
                  // Extract user information, handling both populated and unpopulated cases
                  const userId = member.user._id || member.user;
                  const username = member.user.username || `User ID: ${userId}`;
                  const isAdmin = userId === (group.admin._id || group.admin);

                  return (
                    <div key={userId} className="member-item">
                      <div className="member-info">
                        <span className="username">
                          {username}{" "}
                          {isAdmin && (
                            <span className="admin-badge">Admin</span>
                          )}
                        </span>
                        <span className="member-since">
                          Member since:{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {!isAdmin && (
                        <div className="member-actions">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveMember(userId)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No members in this group yet.</p>
            )}
          </div>
        </div>

        <div className="card danger-zone">
          <div className="card-header">
            <h2>Danger Zone</h2>
          </div>
          <div className="card-body">
            <div className="danger-action">
              <div className="danger-info">
                <h3>Delete Group</h3>
                <p>
                  Once you delete a group, there is no going back. Please be
                  certain.
                </p>
              </div>
              <button
                className="btn btn-danger"
                onClick={handleDeleteGroup}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Group"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageGroup;
