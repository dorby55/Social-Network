import { useContext, useState, useEffect } from "react";
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
          <div className="welcome-header">
            <h1 className="welcome-title">Welcome to Social Network</h1>
            <p className="welcome-subtitle">
              Connect with friends, join communities, and share your thoughts in
              a simple, clean social platform designed for meaningful
              connections.
            </p>
          </div>

          <div className="welcome-main">
            <div className="welcome-features">
              <div className="feature-item">
                <div className="feature-icon">👥</div>
                <div className="feature-text">
                  <h3>Connect with Friends</h3>
                  <p>
                    Build your network and stay in touch with people who matter.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">🏘️</div>
                <div className="feature-text">
                  <h3>Join Communities</h3>
                  <p>Find groups based on your interests and hobbies.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">💬</div>
                <div className="feature-text">
                  <h3>Share & Chat</h3>
                  <p>Post updates and have real-time conversations.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div className="feature-text">
                  <h3>Privacy Focused</h3>
                  <p>Control your privacy with robust security settings.</p>
                </div>
              </div>
            </div>

            <div className="welcome-actions">
              <h2>Ready to get started?</h2>
              <p>Join our community and start connecting today.</p>

              <div className="welcome-buttons">
                <Link to="/register" className="btn btn-primary btn-large">
                  Create Account
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          <div className="welcome-footer">
            <p>
              &copy; 2025 Social Network. Simple social networking done right.
            </p>
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
