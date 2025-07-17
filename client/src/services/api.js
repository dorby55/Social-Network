import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const getUserProfile = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/users/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getAllGroups = async () => {
  try {
    const res = await axios.get(`${API_URL}/groups`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getUserGroups = async () => {
  try {
    const res = await axios.get(`${API_URL}/groups/my`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getGroupById = async (groupId) => {
  try {
    const res = await axios.get(`${API_URL}/groups/${groupId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const createGroup = async (groupData) => {
  try {
    const res = await axios.post(`${API_URL}/groups`, groupData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const joinGroup = async (groupId) => {
  try {
    const res = await axios.post(`${API_URL}/groups/${groupId}/join`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getFeed = async () => {
  try {
    const res = await axios.get(`${API_URL}/posts`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getPostById = async (postId) => {
  try {
    const res = await axios.get(`${API_URL}/posts/${postId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getUserPosts = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/posts/user/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getGroupPosts = async (groupId) => {
  try {
    const res = await axios.get(`${API_URL}/posts/group/${groupId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const createPost = async (postData) => {
  try {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
    };

    const payload = {
      text: postData.text,
      group: postData.group,
      mediaType: postData.mediaType || "none",
      mediaUrl: postData.mediaUrl || "",
    };

    const res = await axios.post(`${API_URL}/posts`, payload, config);
    return res.data;
  } catch (error) {
    console.error("Error creating post:", error.response?.data || error);
    throw error;
  }
};

export const likePost = async (postId) => {
  try {
    const res = await axios.put(`${API_URL}/posts/like/${postId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const unlikePost = async (postId) => {
  try {
    const res = await axios.put(`${API_URL}/posts/unlike/${postId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const deletePost = async (postId) => {
  try {
    const res = await axios.delete(`${API_URL}/posts/${postId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updatePost = async (postId, postData) => {
  try {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
    };

    const res = await axios.put(`${API_URL}/posts/${postId}`, postData, config);
    return res.data;
  } catch (error) {
    console.error("Error updating post:", error.response?.data || error);
    throw error;
  }
};

export const addComment = async (postId, text) => {
  try {
    const res = await axios.post(`${API_URL}/posts/comment/${postId}`, {
      text,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateComment = async (postId, commentId, commentData) => {
  try {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
    };
    const res = await axios.put(
      `${API_URL}/posts/comment/${postId}/${commentId}`,
      commentData,
      config
    );
    return res.data;
  } catch (error) {
    console.error("Error updating comment:", error.response?.data || error);
    throw error;
  }
};

export const deleteComment = async (postId, commentId) => {
  try {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };

    const res = await axios.delete(
      `${API_URL}/posts/comment/${postId}/${commentId}`,
      config
    );
    return res.data;
  } catch (error) {
    console.error("Error deleting comment:", error.response?.data || error);
    throw error;
  }
};

export const addFriend = async (userId) => {
  try {
    const res = await axios.post(`${API_URL}/users/friends/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const removeFriend = async (userId) => {
  try {
    const res = await axios.delete(`${API_URL}/users/friends/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getConversation = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/messages/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getAllConversations = async () => {
  try {
    const res = await axios.get(`${API_URL}/messages`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getUnreadCount = async () => {
  try {
    const res = await axios.get(`${API_URL}/messages/unread`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const sendMessage = async (receiverId, content) => {
  try {
    const res = await axios.post(`${API_URL}/messages`, {
      receiver: receiverId,
      content,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getPostsPerMonth = async () => {
  try {
    const res = await axios.get(`${API_URL}/stats/posts/monthly`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getGroupsByMembers = async () => {
  try {
    const res = await axios.get(`${API_URL}/stats/groups/members`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const sendFriendRequest = async (userId) => {
  try {
    const res = await axios.post(`${API_URL}/users/friend-requests/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const acceptFriendRequest = async (userId) => {
  try {
    const res = await axios.post(
      `${API_URL}/users/friend-requests/${userId}/accept`
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const rejectFriendRequest = async (userId) => {
  try {
    const res = await axios.post(
      `${API_URL}/users/friend-requests/${userId}/reject`
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getFriendRequests = async () => {
  try {
    const res = await axios.get(`${API_URL}/users/friend-requests`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const searchUsers = async (query) => {
  try {
    const res = await axios.get(
      `${API_URL}/users/search?username=${encodeURIComponent(query)}`
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const searchGroups = async (query) => {
  try {
    const res = await axios.get(
      `${API_URL}/groups/search?name=${encodeURIComponent(query)}`
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const searchPosts = async (query) => {
  try {
    const res = await axios.get(
      `${API_URL}/posts/search?text=${encodeURIComponent(query)}`
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const res = await axios.put(`${API_URL}/users/${userId}`, profileData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const uploadProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append("profilePicture", file);

    const res = await axios.post(`${API_URL}/users/profile-picture`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data.profilePicture) {
      const timestamp = new Date().getTime();
      const url = res.data.profilePicture;

      res.data.profilePicture = url.includes("?")
        ? `${url}&t=${timestamp}`
        : `${url}?t=${timestamp}`;
    }

    return res.data;
  } catch (err) {
    throw err;
  }
};

export const deleteProfilePicture = async () => {
  try {
    const res = await axios.delete(`${API_URL}/users/profile-picture`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const uploadPostMedia = async (file) => {
  try {
    const formData = new FormData();
    formData.append("media", file);

    const res = await axios.post(`${API_URL}/posts/media-upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (err) {
    throw err;
  }
};

export const deleteGroup = async (groupId) => {
  try {
    const res = await axios.delete(`${API_URL}/groups/${groupId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateGroup = async (groupId, groupData) => {
  try {
    const res = await axios.put(`${API_URL}/groups/${groupId}`, groupData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const inviteToGroup = async (groupId, userId) => {
  try {
    const res = await axios.post(
      `${API_URL}/groups/${groupId}/invite/${userId}`
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getUserInvitations = async () => {
  try {
    const res = await axios.get(`${API_URL}/groups/invitations`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const respondToInvitation = async (groupId, accept) => {
  try {
    const res = await axios.put(`${API_URL}/groups/${groupId}/invitation`, {
      accept,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const approveJoinRequest = async (groupId, userId) => {
  try {
    const res = await axios.post(
      `${API_URL}/groups/${groupId}/approve/${userId}`
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const rejectJoinRequest = async (groupId, userId) => {
  try {
    const res = await axios.post(
      `${API_URL}/groups/${groupId}/reject/${userId}`
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const removeMember = async (groupId, userId) => {
  try {
    const res = await axios.delete(
      `${API_URL}/groups/${groupId}/members/${userId}`
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const leaveGroup = async (groupId) => {
  try {
    const res = await axios.delete(`${API_URL}/groups/${groupId}/leave`);
    return res.data;
  } catch (err) {
    console.error("Error leaving group:", err.response?.data || err.message);
    throw err;
  }
};
