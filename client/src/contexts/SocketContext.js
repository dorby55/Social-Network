import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import io from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const socketRef = useRef(null);

  useEffect(() => {
    const cleanup = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };

    // Only connect if user is authenticated
    if (isAuthenticated && currentUser) {
      const newSocket = io("http://localhost:5000", {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        setConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setConnected(false);
      });

      return cleanup;
    } else {
      cleanup();
    }
  }, [isAuthenticated, currentUser]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
