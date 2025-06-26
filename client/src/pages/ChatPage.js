import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { SocketContext } from "../contexts/SocketContext";
import { getCacheBustedUrl } from "../utils/imageUtils";
import { useMessageNotifications } from "../hooks/useMessageNotifications";
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
  const { fetchCount } = useMessageNotifications();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Refresh the notifications when entering chat page
  useEffect(() => {
    console.log("UI: Entered chat page, requesting notification refresh");

    window.dispatchEvent(new Event("refreshMessageNotifications"));

    setTimeout(() => {
      window.dispatchEvent(new Event("refreshMessageNotifications"));
    }, 2000);
  }, []);

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getAllConversations();
        setConversations(data);

        if (userId && !data.some((conv) => conv.otherUser._id === userId)) {
          const userProfile = await getUserProfile(userId);
          if (userProfile) {
            const newConversation = {
              otherUser: {
                _id: userProfile._id,
                username: userProfile.username,
                profilePicture: userProfile.profilePicture,
              },
              content: "",
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

  // Select conversation based on URL or select the first chat
  useEffect(() => {
    const selectInitialConversation = async () => {
      if (conversations.length === 0) return;

      if (userId) {
        const conversation = conversations.find(
          (conv) => conv.otherUser._id === userId
        );

        if (conversation) {
          setCurrentChat(conversation.otherUser);
        } else {
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
        setCurrentChat(conversations[0].otherUser);
      }
    };

    selectInitialConversation();
  }, [conversations, userId]);

  // Fetch messages and refresh notifications
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
        navigate(`/chat/${currentChat._id}`, { replace: true });

        console.log(
          `UI: Loaded chat with ${currentChat.username}, refreshing notifications`
        );

        setTimeout(() => {
          window.dispatchEvent(new Event("refreshMessageNotifications"));
        }, 1000);

        setTimeout(() => {
          window.dispatchEvent(new Event("refreshMessageNotifications"));
        }, 3000);
      } catch (err) {
        setError("Error loading messages. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentChat, navigate]);

  useEffect(() => {
    if (socket && currentChat) {
      const roomId = [currentUser._id, currentChat._id].sort().join("_");

      socket.emit("join_room", { room: roomId });

      const handleReceiveMessage = (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);

        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            const isConversationParticipant =
              conv.otherUser._id === data.sender._id ||
              conv.otherUser._id === data.receiver._id;

            if (isConversationParticipant) {
              return {
                ...conv,
                content: data.content,
                createdAt: data.createdAt,
                unreadCount:
                  data.sender._id !== currentUser._id &&
                  data.sender._id !== currentChat._id
                    ? (conv.unreadCount || 0) + 1
                    : conv.unreadCount || 0,
              };
            }
            return conv;
          });
        });
      };

      socket.on("receive_message", handleReceiveMessage);

      return () => {
        socket.off("receive_message", handleReceiveMessage);
      };
    }
  }, [socket, currentUser, currentChat]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (otherUser) => {
    setCurrentChat(otherUser);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !currentChat || isSending) return;

    setIsSending(true);

    try {
      const newMessage = await sendMessage(currentChat._id, messageInput);
      setMessageInput("");

      setConversations((prevConversations) => {
        return prevConversations.map((conv) => {
          if (conv.otherUser._id === currentChat._id) {
            return {
              ...conv,
              content: newMessage.content,
              createdAt: newMessage.createdAt,
              unreadCount: 0,
            };
          }
          return conv;
        });
      });

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
