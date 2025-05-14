// src/pages/ChatPage.js
import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { SocketContext } from "../contexts/SocketContext";
import { getCacheBustedUrl } from "../utils/imageUtils";
import {
  getConversation,
  getAllConversations,
  sendMessage,
  getUserProfile,
} from "../services/api";

const ChatPage = () => {
  const { userId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Fetch all conversations
  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getAllConversations();
        setConversations(data);

        // If we have a userId from the URL, and we don't find it in conversations,
        // we need to fetch the user profile to create a new conversation
        if (userId && !data.some((conv) => conv.otherUser._id === userId)) {
          const userProfile = await getUserProfile(userId);
          if (userProfile) {
            // Create a placeholder conversation
            const newConversation = {
              otherUser: {
                _id: userProfile._id,
                username: userProfile.username,
                profilePicture: userProfile.profilePicture,
              },
              content: "", // No messages yet
              unreadCount: 0,
            };

            setConversations((prevConversations) => [
              newConversation,
              ...prevConversations,
            ]);
          }
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };

    fetchConversations();
  }, [userId]);

  // Select conversation based on URL param or default to first conversation
  useEffect(() => {
    const selectInitialConversation = async () => {
      if (conversations.length === 0) return;

      if (userId) {
        // Find conversation with this user
        const conversation = conversations.find(
          (conv) => conv.otherUser._id === userId
        );

        if (conversation) {
          setCurrentChat(conversation.otherUser);
        } else {
          // If we don't have a conversation yet but have a userId,
          // we can fetch the user profile
          try {
            const userProfile = await getUserProfile(userId);
            if (userProfile) {
              setCurrentChat({
                _id: userProfile._id,
                username: userProfile.username,
                profilePicture: userProfile.profilePicture,
              });
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
          }
        }
      } else if (conversations.length > 0) {
        // Default to first conversation if no userId specified
        setCurrentChat(conversations[0].otherUser);
      }
    };

    selectInitialConversation();
  }, [conversations, userId]);

  // Fetch conversation messages when currentChat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) {
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await getConversation(currentChat._id);
        setMessages(data);
        setError(null);

        // Update URL to reflect current chat
        navigate(`/chat/${currentChat._id}`, { replace: true });
      } catch (err) {
        setError("Error loading messages. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentChat, navigate]);

  // Join socket room when current chat changes
  useEffect(() => {
    if (socket && currentChat) {
      const roomId = [currentUser._id, currentChat._id].sort().join("_");

      // Join room
      socket.emit("join_room", { room: roomId });

      // Listen for new messages
      socket.on("receive_message", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });

      return () => {
        socket.off("receive_message");
      };
    }
  }, [socket, currentUser, currentChat]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle select conversation (make sure to update this too)
  const handleSelectConversation = (otherUser) => {
    setCurrentChat(otherUser);
  };

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !currentChat || isSending) return;

    setIsSending(true);

    try {
      // Create message data
      const newMessage = await sendMessage(currentChat._id, messageInput);

      // Clear input
      setMessageInput("");

      // Emit socket event
      if (socket) {
        socket.emit("send_message", newMessage);
      }
    } catch (err) {
      setError("Error sending message. Please try again.");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <h2>Conversations</h2>

        {conversations.length === 0 ? (
          <p className="empty-conversations">No conversations yet</p>
        ) : (
          <ul className="conversations-list">
            {conversations.map((conversation) => (
              <li
                key={conversation.otherUser._id}
                className={`conversation-item ${
                  currentChat?._id === conversation.otherUser._id
                    ? "active"
                    : ""
                }`}
                onClick={() => handleSelectConversation(conversation.otherUser)}
              >
                <div className="conversation-avatar">
                  <img
                    src={getCacheBustedUrl(
                      conversation.otherUser.profilePicture
                    )}
                    alt={conversation.otherUser.username}
                    className="avatar"
                  />
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {conversation.otherUser.username}
                  </div>
                  <div className="conversation-preview">
                    {conversation.content
                      ? conversation.content.length > 30
                        ? conversation.content.substring(0, 30) + "..."
                        : conversation.content
                      : "Start a conversation..."}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chat-main">
        {!currentChat ? (
          <div className="chat-empty">
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-user">
                <img
                  src={currentChat.profilePicture || "/default-avatar.png"}
                  alt={currentChat.username}
                  className="avatar"
                />
                <span className="username">{currentChat.username}</span>
              </div>
            </div>

            <div className="chat-messages">
              {loading ? (
                <div className="loading">Loading messages...</div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : messages.length === 0 ? (
                <div className="empty-messages">
                  <p>
                    No messages yet. Send a message to start the conversation!
                  </p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`message-item ${
                        message.sender._id === currentUser._id
                          ? "sent"
                          : "received"
                      }`}
                    >
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="chat-input">
              <form onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !messageInput.trim()}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
