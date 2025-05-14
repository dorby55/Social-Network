// src/pages/Home.js
import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { getFeed, createPost } from "../services/api";
import PostItem from "../components/post/PostItem";
import CreatePostForm from "../components/post/CreatePostForm";

const Home = () => {
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch feed posts
  useEffect(() => {
    const loadFeed = async () => {
      if (isAuthenticated) {
        try {
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

    loadFeed();
  }, [isAuthenticated]);

  // Handle new post creation
  const handleCreatePost = async (postData) => {
    try {
      const newPost = await createPost(postData);
      setPosts([newPost, ...posts]);
      return true;
    } catch (err) {
      setError("Error creating post. Please try again.");
      console.error(err);
      return false;
    }
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(posts.filter((post) => post._id !== deletedPostId));
  };

  // Display welcome page for non-authenticated users
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
        <CreatePostForm onCreatePost={handleCreatePost} />

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
            posts.map((post) => (
              <PostItem
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))
          )}
        </div>
      </div>

      {/* Sidebar with trending topics, groups, etc. */}
      <div className="sidebar">
        <div className="sidebar-section">
          <h3>Your Groups</h3>
          {/* List of user's groups */}
        </div>

        <div className="sidebar-section">
          <h3>Trending</h3>
          {/* Trending topics or popular posts */}
        </div>
      </div>
    </div>
  );
};

export default Home;
