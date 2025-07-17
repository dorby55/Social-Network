import { useState, useEffect, useContext } from "react";
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
import UserItem from "../components/user/UserItem";
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

  const isOwnProfile = currentUser?._id === id;

  const isFriend = profile?.friends.some(
    (friendId) => friendId === currentUser?._id
  );

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);

      setFriends([]);
      setUserGroups([]);
      setActiveTab("posts");
      try {
        const userData = await getUserProfile(id);
        setProfile(userData);

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
        const requests = await getFriendRequests();

        const receivedRequest = requests.some(
          (request) => request.user._id === id
        );

        if (receivedRequest) {
          setFriendRequestStatus("received");
        } else {
          setFriendRequestStatus("none");
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkFriendRequestStatus();
  }, [id, isOwnProfile, profile, currentUser]);

  useEffect(() => {
    const loadTabData = async () => {
      if (!profile) return;

      if (activeTab === "friends") {
        setLoadingFriends(true);
        try {
          if (profile.friends && profile.friends.length > 0) {
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

            const { getGroupById } = await import("../services/api");
            const groupsData = [];

            for (const groupId of profile.groups) {
              const id = typeof groupId === "object" ? groupId._id : groupId;
              try {
                const groupData = await getGroupById(id);
                groupsData.push(groupData);
              } catch (err) {
                console.warn(`Couldn't load group ${id}:`, err.message);
              }
            }

            setUserGroups(groupsData);
            setError(null);
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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleFriendAction = async () => {
    setUpdating(true);

    try {
      if (isFriend) {
        await removeFriend(id);
        const updatedProfile = { ...profile };
        if (updatedProfile.friends) {
          updatedProfile.friends = updatedProfile.friends.filter(
            (friendId) => friendId !== currentUser._id
          );
        }
        setProfile(updatedProfile);
        setFriendRequestStatus("none");
      } else if (friendRequestStatus === "received") {
        await acceptFriendRequest(id);
        const updatedProfile = await getUserProfile(id);
        setProfile(updatedProfile);
      } else {
        await sendFriendRequest(id);
        setFriendRequestStatus("pending");
      }

      setError(null);
    } catch (err) {
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
