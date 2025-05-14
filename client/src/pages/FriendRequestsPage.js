// src/pages/FriendRequestsPage.js
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { getCacheBustedUrl } from "../utils/imageUtils";
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../services/api";

const FriendRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFriendRequests = async () => {
      try {
        console.log("Fetching friend requests...");
        const data = await getFriendRequests();
        console.log("Raw API response:", data);
        console.log("Friend requests data:", data);
        setRequests(data);
        setError(null);
      } catch (err) {
        setError("Failed to load friend requests. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFriendRequests();
  }, []);

  const handleAcceptRequest = async (userId) => {
    try {
      await acceptFriendRequest(userId);
      // Remove the request from the list
      setRequests(requests.filter((request) => request.user._id !== userId));
    } catch (err) {
      setError("Failed to accept friend request. Please try again.");
      console.error(err);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await rejectFriendRequest(userId);
      // Remove the request from the list
      setRequests(requests.filter((request) => request.user._id !== userId));
    } catch (err) {
      setError("Failed to reject friend request. Please try again.");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading friend requests...</div>;
  }

  return (
    <div className="friend-requests-page">
      <h1>Friend Requests</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {requests.length === 0 ? (
        <div className="empty-requests">
          <p>You don't have any friend requests at the moment.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.user._id} className="request-card">
              <div className="request-user">
                <img
                  src={getCacheBustedUrl(request.user.profilePicture)}
                  alt={request.user.username}
                  className="avatar"
                />
                <div className="request-info">
                  <h3>
                    <Link to={`/profile/${request.user._id}`}>
                      {request.user.username}
                    </Link>
                  </h3>
                  <p className="request-date">
                    Sent {new Date(request.sentAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="request-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleAcceptRequest(request.user._id)}
                >
                  Accept
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRejectRequest(request.user._id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequestsPage;
