import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { getUserInvitations } from "../services/api";

export const useGroupInvitationNotifications = () => {
  const [count, setCount] = useState(0);
  const { isAuthenticated, currentUser } = useContext(AuthContext);

  const fetchCount = async () => {
    if (!isAuthenticated || !currentUser) return;

    try {
      const response = await getUserInvitations();
      setCount(response.length || 0);
    } catch (error) {
      console.error("Error fetching group invitations:", error);
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
