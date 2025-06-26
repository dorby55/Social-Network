import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { SocketContext } from "../contexts/SocketContext";
import { getAllConversations } from "../services/api";

export const useMessageNotifications = () => {
  const [count, setCount] = useState(0);
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const fetchCount = async () => {
    if (!isAuthenticated || !currentUser) return;

    try {
      const conversations = await getAllConversations();

      const totalUnread = conversations.reduce((total, conv) => {
        return total + (conv.unreadCount || 0);
      }, 0);

      console.log(
        `UI: Updating notification badge from ${count} to ${totalUnread}`
      );
      setCount(totalUnread);
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setCount(0);
    }
  };

  useEffect(() => {
    fetchCount();
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (socket && isAuthenticated && currentUser) {
      const handleNewMessage = (data) => {
        const isOnChatPage = window.location.pathname.startsWith("/chat");

        if (
          data.receiver._id === currentUser._id &&
          data.sender._id !== currentUser._id &&
          !isOnChatPage
        ) {
          console.log(
            `UI: New message received, incrementing badge from ${count} to ${
              count + 1
            }`
          );
          setCount((prevCount) => prevCount + 1);
        }
      };

      socket.on("receive_message", handleNewMessage);

      return () => {
        socket.off("receive_message", handleNewMessage);
      };
    }
  }, [socket, isAuthenticated, currentUser, count]);

  useEffect(() => {
    const handleForceRefresh = () => {
      console.log("UI: ChatPage requested notification refresh");
      fetchCount();
    };

    window.addEventListener("refreshMessageNotifications", handleForceRefresh);

    return () => {
      window.removeEventListener(
        "refreshMessageNotifications",
        handleForceRefresh
      );
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const interval = setInterval(() => {
      const isOnChatPage = window.location.pathname.startsWith("/chat");
      if (!isOnChatPage) {
        fetchCount();
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser]);

  const resetCount = () => {
    console.log("UI: Manually resetting notification badge to 0");
    setCount(0);
  };

  return { count, resetCount, fetchCount };
};
