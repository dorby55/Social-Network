import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { SocketContext } from "../../contexts/SocketContext";
import { AuthContext } from "../../contexts/AuthContext";
import { getUnreadCount } from "../../services/api";

const MessageNotification = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useContext(SocketContext);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        setUnreadCount(response.count);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    if (currentUser) {
      fetchUnreadCount();
    }
  }, [currentUser]);

  useEffect(() => {
    if (socket) {
      socket.on("receive_message", (data) => {
        if (
          data.receiver._id === currentUser?._id &&
          data.sender._id !== currentUser?._id
        ) {
          setUnreadCount((prev) => prev + 1);
        }
      });

      return () => {
        socket.off("receive_message");
      };
    }
  }, [socket, currentUser]);

  return unreadCount > 0 ? (
    <Link to="/chat" className="message-notification">
      <i className="fas fa-envelope"></i>
      <span className="notification-badge">{unreadCount}</span>
    </Link>
  ) : null;
};

export default MessageNotification;
