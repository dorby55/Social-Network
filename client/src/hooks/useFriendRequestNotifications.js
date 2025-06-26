import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { getFriendRequests } from "../services/api";

export const useFriendRequestNotifications = () => {
  const [count, setCount] = useState(0);
  const { isAuthenticated, currentUser } = useContext(AuthContext);

  const fetchCount = async () => {
    if (!isAuthenticated || !currentUser) return;

    try {
      const response = await getFriendRequests();
      setCount(response.length || 0);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      setCount(0);
    }
  };

  useEffect(() => {
    fetchCount();
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const interval = setInterval(() => {
      fetchCount();
    }, 120000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser]);

  const resetCount = () => {
    setCount(0);
  };

  return { count, resetCount, fetchCount };
};
