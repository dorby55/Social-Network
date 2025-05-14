// src/pages/GroupsList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllGroups } from "../services/api";
import GroupItem from "../components/group/GroupItem";

const GroupsList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await getAllGroups();
        setGroups(data);
        setError(null);
      } catch (err) {
        setError("Error loading groups. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Filter groups based on search term
  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="groups-page">
      <div className="page-header">
        <h1>Groups</h1>
        <Link to="/create-group" className="btn btn-primary">
          Create Group
        </Link>
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
          <p>No groups found. Try a different search or create a new group.</p>
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
