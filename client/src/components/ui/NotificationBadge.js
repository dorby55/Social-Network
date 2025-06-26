import React from "react";

const NotificationBadge = ({ count, children }) => {
  return (
    <div className="notification-wrapper">
      {children}
      {count > 0 && (
        <span className="notification-badge">{count > 99 ? "99+" : count}</span>
      )}
    </div>
  );
};

export default NotificationBadge;
