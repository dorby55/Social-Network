// src/pages/Profile.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getUserProfile,
  getUserPosts,
  removeFriend,
  getFriendRequests,
  acceptFriendRequest,
  sendFriendRequest,
} from "../services/api";
import PostItem from "../components/post/PostItem";
import UserItem from "../components/user/UserItem"; // Make sure this is imported
import GroupItem from "../components/group/GroupItem";
import { getCacheBustedUrl } from "../utils/imageUtils";

const Profile = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState("none");
  const [activeTab, setActiveTab] = useState("posts");
  const [friends, setFriends] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const navigate = useNavigate();

  // Check if viewing own profile
  const isOwnProfile = currentUser?._id === id;

  // Check if user is a friend
  const isFriend = profile?.friends.some(
    (friendId) => friendId === currentUser?._id
  );

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);

      // Reset these arrays when loading a new profile
      setFriends([]);
      setUserGroups([]);
      setActiveTab("posts"); // Reset to posts tab
      try {
        // Fetch user profile
        const userData = await getUserProfile(id);
        setProfile(userData);

        // Fetch user posts
        const postsData = await getUserPosts(id);
        setPosts(postsData);

        setError(null);
      } catch (err) {
        setError("Error loading profile. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  useEffect(() => {
    const checkFriendRequestStatus = async () => {
      if (isOwnProfile || !profile) return;

      try {
        // Get my friend requests
        const requests = await getFriendRequests();

        // Check if we've received a request from this user
        const receivedRequest = requests.some(
          (request) => request.user._id === id
        );

        if (receivedRequest) {
          setFriendRequestStatus("received");
        } else {
          // Check if current user has sent a request to profile user
          // This would require a new endpoint, so for now we'll infer this from backend error messages
          setFriendRequestStatus("none");
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkFriendRequestStatus();
  }, [id, isOwnProfile, profile, currentUser]);

  // Add a new useEffect to load friends and groups when tabs are clicked
  useEffect(() => {
    const loadTabData = async () => {
      if (!profile) return;

      if (activeTab === "friends") {
        setLoadingFriends(true);
        try {
          // Always reload friends data when switching to this tab or changing profiles
          if (profile.friends && profile.friends.length > 0) {
            console.log("Loading friends data for", profile.friends);
            const friendPromises = profile.friends.map((friendId) =>
              getUserProfile(
                typeof friendId === "object" ? friendId._id : friendId
              )
            );
            const friendsData = await Promise.all(friendPromises);
            setFriends(friendsData);
          } else {
            setFriends([]);
          }
        } catch (err) {
          console.error("Error loading friends:", err);
          setError("Failed to load friends data");
        } finally {
          setLoadingFriends(false);
        }
      }

      if (activeTab === "groups") {
        setLoadingGroups(true);
        try {
          if (profile.groups && profile.groups.length > 0) {
            console.log("Loading groups data for", profile.groups);

            // Import the API function if needed
            const { getGroupById } = await import("../services/api");

            // Instead of Promise.all (which fails if any request fails),
            // use individual promises with error handling for each group
            const groupsData = [];

            for (const groupId of profile.groups) {
              const id = typeof groupId === "object" ? groupId._id : groupId;
              try {
                const groupData = await getGroupById(id);
                groupsData.push(groupData);
              } catch (err) {
                console.warn(`Couldn't load group ${id}:`, err.message);
                // Skip this group but continue loading others
              }
            }

            setUserGroups(groupsData);
            setError(null); // Clear any previous errors
          } else {
            setUserGroups([]);
          }
        } catch (err) {
          console.error("Error loading groups:", err);
          setError("Failed to load some group data");
        } finally {
          setLoadingGroups(false);
        }
      }
    };

    loadTabData();
  }, [profile, activeTab, currentUser]);

  // Update the tab click handlers
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handle add/remove friend
  const handleFriendAction = async () => {
    setUpdating(true);

    try {
      if (isFriend) {
        // Remove friend
        await removeFriend(id);

        // Update local state to reflect that they are no longer friends
        // This is the key change to fix the bug
        const updatedProfile = { ...profile };
        if (updatedProfile.friends) {
          updatedProfile.friends = updatedProfile.friends.filter(
            (friendId) => friendId !== currentUser._id
          );
        }
        setProfile(updatedProfile);
        setFriendRequestStatus("none");
      } else if (friendRequestStatus === "received") {
        // Accept friend request
        await acceptFriendRequest(id);
        // Refresh profile to update friend status
        const updatedProfile = await getUserProfile(id);
        setProfile(updatedProfile);
      } else {
        // Send friend request
        await sendFriendRequest(id);
        setFriendRequestStatus("pending");
      }

      setError(null);
    } catch (err) {
      // Check if the error is because a request is already pending
      if (
        err.response &&
        err.response.data &&
        err.response.data.msg === "Friend request already sent"
      ) {
        setFriendRequestStatus("pending");
      } else {
        setError(`Error updating friend status. Please try again.`);
      }
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(posts.filter((post) => post._id !== deletedPostId));
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!profile) {
    return <div className="not-found">User not found</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-cover">
          {/* Cover photo could be added here */}
        </div>

        <div className="profile-info">
          <div className="profile-avatar">
            <img
              src={getCacheBustedUrl(
                id === currentUser?._id
                  ? currentUser?.profilePicture
                  : profile?.profilePicture
              )}
              alt={profile?.username}
              className="avatar large"
            />
          </div>

          <div className="profile-details">
            <h1 className="profile-name">{profile.username}</h1>
            <p className="profile-bio">{profile.bio || "No bio available"}</p>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{profile.friends.length}</span>
                <span className="stat-label">Friends</span>
              </div>
              <div className="stat">
                <span className="stat-value">{posts.length}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <span className="stat-value">{profile.groups.length}</span>
                <span className="stat-label">Groups</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <Link to="/profile/edit" className="btn btn-primary">
                Edit Profile
              </Link>
            ) : (
              <>
                <button
                  className={`btn ${
                    isFriend ? "btn-secondary" : "btn-primary"
                  }`}
                  onClick={handleFriendAction}
                  disabled={updating}
                >
                  {updating
                    ? "Processing..."
                    : isFriend
                    ? "Remove Friend"
                    : friendRequestStatus === "pending"
                    ? "Request Sent"
                    : friendRequestStatus === "received"
                    ? "Accept Request"
                    : "Add Friend"}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => navigate(`/chat/${id}`)}
                >
                  Message
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => handleTabClick("posts")}
          >
            Posts
          </button>
          <button
            className={`tab-button ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => handleTabClick("friends")}
          >
            Friends
          </button>
          <button
            className={`tab-button ${activeTab === "groups" ? "active" : ""}`}
            onClick={() => handleTabClick("groups")}
          >
            Groups
          </button>
        </div>

        <div className="profile-tab-content">
          {activeTab === "posts" && (
            <div className="profile-posts" key={`posts-${profile._id}`}>
              {loading ? (
                <div className="loading">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="empty-posts">
                  <p>No posts yet.</p>
                  {isOwnProfile && (
                    <p>Share your thoughts with your friends!</p>
                  )}
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
          )}

          {activeTab === "friends" && (
            <div className="profile-friends" key={`friends-${profile._id}`}>
              {loadingFriends ? (
                <div className="loading">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="empty-friends">
                  <p>
                    {isOwnProfile ? "You don't" : "This user doesn't"} have any
                    friends yet.
                  </p>
                  {isOwnProfile && (
                    <Link to="/search" className="btn btn-primary">
                      Find Friends
                    </Link>
                  )}
                </div>
              ) : (
                <div className="friends-grid">
                  {friends.map((friend) => (
                    <UserItem key={friend._id} user={friend} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "groups" && (
            <div className="profile-groups" key={`groups-${profile._id}`}>
              {loadingGroups ? (
                <div className="loading">Loading groups...</div>
              ) : userGroups.length === 0 ? (
                <div className="empty-groups">
                  <p>
                    {isOwnProfile ? "You're" : "This user isn't"} not a member
                    of any groups yet.
                  </p>
                  {isOwnProfile && (
                    <Link to="/groups" className="btn btn-primary">
                      Discover Groups
                    </Link>
                  )}
                </div>
              ) : (
                <div className="groups-grid">
                  {userGroups.map((group) => (
                    <GroupItem key={group._id} group={group} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
