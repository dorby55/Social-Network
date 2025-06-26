import React from "react";
import { Link } from "react-router-dom";

const GroupItem = ({ group }) => {
  const isRestricted = group.restricted === true;

  return (
    <div className={`group-item ${isRestricted ? "restricted" : ""}`}>
      <div className="group-cover">
        {isRestricted && (
          <div className="restricted-badge">
            <i className="fas fa-lock"></i> Private
          </div>
        )}
      </div>
      <div className="group-info">
        <h3 className="group-name">
          {isRestricted ? (
            <span>{group.name}</span>
          ) : (
            <Link to={`/groups/${group._id}`}>{group.name}</Link>
          )}
        </h3>
        {isRestricted ? (
          <p className="group-description">
            This is a private group. You need to be a member to see details.
          </p>
        ) : (
          <p className="group-description">{group.description}</p>
        )}
        <div className="group-meta">
          {!isRestricted && (
            <span className="group-members">
              <i className="fas fa-users"></i>{" "}
              {group.members ? group.members.length : 0} members
            </span>
          )}
          {group.isPrivate && (
            <span className="group-privacy">
              <i className="fas fa-lock"></i> Private
            </span>
          )}
        </div>
      </div>
      <div className="group-footer">
        {isRestricted ? (
          <span className="btn btn-disabled">Private Group</span>
        ) : (
          <Link to={`/groups/${group._id}`} className="btn btn-outline">
            View Group
          </Link>
        )}
      </div>
    </div>
  );
};

export default GroupItem;
