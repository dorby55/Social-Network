import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { getFeed } from "../services/api";
import PostItem from "../components/post/PostItem";
import CreatePostForm from "../components/post/CreatePostForm";

const Home = () => {
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch feed posts
  const loadFeed = async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const data = await getFeed();
        setPosts(data);
        setError(null);
      } catch (err) {
        setError("Error loading feed. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [isAuthenticated]);

  const handlePostCreated = (newPost) => {
    console.log("New post created on home feed:", newPost);
    setPosts((prevPosts) => [newPost, ...prevPosts]);
    setError(null);
  };

  const handlePostUpdated = (updatedPost) => {
    console.log("Post updated on home feed:", updatedPost);
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handlePostDeleted = (deletedPostId) => {
    console.log("Post deleted from home feed:", deletedPostId);
    setPosts((prevPosts) =>
      prevPosts.filter((post) => post._id !== deletedPostId)
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="welcome-page">
        <div className="welcome-content">
          <h1>Welcome to Social Network</h1>
          <p>Connect with friends, join groups, and share your thoughts.</p>
          <div className="welcome-buttons">
            <Link to="/login" className="btn btn-primary">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-outline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="feed-container">
        <CreatePostForm groupId={null} onPostCreated={handlePostCreated} />

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="feed">
          <h2>Your Feed</h2>

          {loading ? (
            <div className="loading">Loading feed...</div>
          ) : posts.length === 0 ? (
            <div className="empty-feed">
              <p>
                Your feed is empty. Follow friends or join groups to see posts.
              </p>
              <div className="empty-feed-actions">
                <button
                  onClick={() => navigate("/groups")}
                  className="btn btn-primary"
                >
                  Discover Groups
                </button>
              </div>
            </div>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <PostItem
                  key={post._id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  onPostUpdated={handlePostUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
