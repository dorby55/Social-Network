import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllGroups, getUserGroups } from "../services/api";
import GroupItem from "../components/group/GroupItem";

const GroupsList = () => {
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const [allGroupsData, userGroupsData] = await Promise.all([
          getAllGroups(),
          getUserGroups(),
        ]);

        setGroups(allGroupsData);
        setUserGroups(userGroupsData);
        setError(null);
      } catch (err) {
        console.error("Error loading groups:", err);
        setError("Error loading groups. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const getFilteredGroups = () => {
    const groupsToFilter = activeTab === "my" ? userGroups : groups;

    return groupsToFilter.filter(
      (group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredGroups = getFilteredGroups();

  return (
    <div className="groups-page">
      <div className="page-header">
        <h1>Groups</h1>
        <Link to="/create-group" className="btn btn-primary">
          Create Group
        </Link>
      </div>

      <div className="groups-tabs">
        <button
          className={`tab-button ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Groups
        </button>
        <button
          className={`tab-button ${activeTab === "my" ? "active" : ""}`}
          onClick={() => setActiveTab("my")}
        >
          My Groups ({userGroups.length})
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Loading groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="empty-state">
          <p>
            {activeTab === "my"
              ? "You haven't joined any groups yet. Join a group or create a new one."
              : "No groups found. Try a different search or create a new group."}
          </p>
        </div>
      ) : (
        <div className="groups-grid">
          {filteredGroups.map((group) => (
            <GroupItem key={group._id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsList;
