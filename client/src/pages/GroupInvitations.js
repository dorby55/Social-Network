import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserInvitations, respondToInvitation } from "../services/api";
import { useGroupInvitationNotifications } from "../hooks/useGroupInvitationNotifications";

const GroupInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { resetCount } = useGroupInvitationNotifications();

  useEffect(() => {
    resetCount();
  }, [resetCount]);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const data = await getUserInvitations();
        console.log("Fetched invitations:", data);
        setInvitations(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching invitations:", err);
        setError("Failed to load invitations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  const handleViewGroupInfo = (group) => {
    if (group.isPrivate) {
      return;
    } else {
      navigate(`/groups/${group._id}`);
    }
  };

  const handleResponse = async (groupId, accept) => {
    try {
      setLoading(true);
      const result = await respondToInvitation(groupId, accept);
      console.log("Response result:", result);

      window.location.reload();

      setError(null);
    } catch (err) {
      console.error("Error responding to invitation:", err);
      setError("Failed to respond to invitation. Please try again.");
      setLoading(false);
    }
  };

  if (loading && invitations.length === 0) {
    return <div className="loading">Loading invitations...</div>;
  }

  return (
    <div className="group-invitations-page">
      <div className="page-header">
        <h1>Group Invitations</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {invitations.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any pending group invitations.</p>
          <Link to="/groups" className="btn btn-primary">
            Browse Groups
          </Link>
        </div>
      ) : (
        <div className="invitations-list">
          {invitations.map((invitation) => (
            <div key={invitation.group._id} className="invitation-card">
              <div className="invitation-details">
                <h3>{invitation.group.name}</h3>
                <p className="group-description">
                  {invitation.group.description}
                </p>
                <div className="invitation-meta">
                  {invitation.group.isPrivate ? (
                    <span className="badge private">Private</span>
                  ) : (
                    <span className="badge public">Public</span>
                  )}
                  <span className="invited-by">
                    Invited by:{" "}
                    {invitation.invitation.invitedBy &&
                    invitation.invitation.invitedBy.username
                      ? invitation.invitation.invitedBy.username
                      : "Unknown User"}
                  </span>
                  <span className="invited-at">
                    on{" "}
                    {new Date(
                      invitation.invitation.invitedAt
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="invitation-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleResponse(invitation.group._id, true)}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Accept"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleResponse(invitation.group._id, false)}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Decline"}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleViewGroupInfo(invitation.group)}
                  disabled={loading}
                >
                  Group Info
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupInvitations;
