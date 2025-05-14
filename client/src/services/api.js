// src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// User API calls
export const getUserProfile = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/users/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Group API calls
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

// Request to join a group
export const joinGroup = async (groupId) => {
  try {
    const res = await axios.post(`${API_URL}/groups/${groupId}/join`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Post API calls
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

// Get all posts by a user
export const getUserPosts = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/posts/user/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Get all posts in a group
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
    const res = await axios.post(`${API_URL}/posts`, postData);
    return res.data;
  } catch (err) {
    throw err;
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

// Add a friend
export const addFriend = async (userId) => {
  try {
    const res = await axios.post(`${API_URL}/users/friends/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Remove a friend
export const removeFriend = async (userId) => {
  try {
    const res = await axios.delete(`${API_URL}/users/friends/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Message API calls
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

// Statistics API calls
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

// In src/services/api.js - Add or update these functions
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

    // Add a timestamp to force cache refresh
    if (res.data.profilePicture) {
      const timestamp = new Date().getTime();
      const url = res.data.profilePicture;

      // Add timestamp to URL
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
