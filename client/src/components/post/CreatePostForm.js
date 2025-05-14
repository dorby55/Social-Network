// src/components/post/CreatePostForm.js - Enhanced version with file upload and YouTube support
import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { getUserGroups, createPost, uploadPostMedia } from "../../services/api";

const CreatePostForm = ({ onCreatePost }) => {
  const { currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    text: "",
    group: "",
    mediaType: "none",
    mediaUrl: "",
  });
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaInputType, setMediaInputType] = useState("none"); // 'none', 'file', 'url', 'youtube'
  const [mediaPreview, setMediaPreview] = useState(null);

  const fileInputRef = useRef(null);
  const [mediaFile, setMediaFile] = useState(null);

  // Fetch user's groups
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const groups = await getUserGroups();
        setUserGroups(groups);
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };

    fetchUserGroups();
  }, []);

  const { text, group } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);

    // Update YouTube preview if user is entering YouTube URL
    if (mediaInputType === "youtube" && e.target.name === "mediaUrl") {
      const youtubeUrl = e.target.value;
      updateYouTubePreview(youtubeUrl);
    }
  };

  const updateYouTubePreview = (url) => {
    try {
      let videoId = "";

      // Extract video ID from different YouTube URL formats
      if (url.includes("youtube.com/watch?v=")) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get("v");
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      } else if (url.includes("youtube.com/embed/")) {
        videoId = url.split("youtube.com/embed/")[1].split("?")[0];
      }

      if (videoId) {
        // Create preview iframe
        setMediaPreview(
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video preview"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        );
      } else {
        setMediaPreview(null);
      }
    } catch (e) {
      setMediaPreview(null);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Only image and video files are supported");
      return;
    }

    setMediaFile(file);

    // Create preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(
          <img
            src={reader.result}
            alt="Preview"
            className="media-preview-image"
          />
        );
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(
          <video controls className="media-preview-video">
            <source src={reader.result} type={file.type} />
            Your browser does not support the video tag.
          </video>
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaTypeChange = (type) => {
    setMediaInputType(type);
    setMediaPreview(null);
    setMediaFile(null);
    setFormData({
      ...formData,
      mediaType: type === "file" ? "none" : type, // Will be set after upload for file type
      mediaUrl: "",
    });

    // Clear file input if exists
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!text.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Handle file upload if a file is selected
      if (mediaInputType === "file" && mediaFile) {
        setUploading(true);

        try {
          const uploadResult = await uploadPostMedia(mediaFile);

          if (uploadResult.success) {
            // Update form data with the uploaded file URL
            setFormData({
              ...formData,
              mediaType: uploadResult.mediaType,
              mediaUrl: uploadResult.mediaUrl,
            });

            // Create post with uploaded media
            const postData = {
              text,
              ...(group ? { group } : {}),
              mediaType: uploadResult.mediaType,
              mediaUrl: uploadResult.mediaUrl,
            };

            const success = await onCreatePost(postData);
            if (success) {
              resetForm();
            }
          }
        } catch (err) {
          console.error("Error uploading media:", err);
          setError("Error uploading media. Please try again.");
        } finally {
          setUploading(false);
        }
      } else {
        // Create post with URL media or no media
        const postData = {
          text,
          ...(group ? { group } : {}),
          mediaType: mediaInputType !== "none" ? mediaInputType : "none",
          mediaUrl: formData.mediaUrl || "",
        };

        const success = await onCreatePost(postData);
        if (success) {
          resetForm();
        }
      }
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Error creating post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      text: "",
      group: "",
      mediaType: "none",
      mediaUrl: "",
    });
    setMediaInputType("none");
    setMediaPreview(null);
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="create-post-form">
      <div className="form-header">
        <img
          src={currentUser.profilePicture || "/default-avatar.png"}
          alt={currentUser.username}
          className="avatar"
        />
        <h3>Create a Post</h3>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <textarea
            name="text"
            value={text}
            onChange={onChange}
            placeholder="What's on your mind?"
            required
          ></textarea>
        </div>

        <div className="media-options">
          <div className="media-buttons">
            <button
              type="button"
              className={`media-button ${
                mediaInputType === "none" ? "active" : ""
              }`}
              onClick={() => handleMediaTypeChange("none")}
            >
              <i className="fas fa-times"></i> No Media
            </button>
            <button
              type="button"
              className={`media-button ${
                mediaInputType === "file" ? "active" : ""
              }`}
              onClick={() => handleMediaTypeChange("file")}
            >
              <i className="fas fa-file-upload"></i> Upload
            </button>
            <button
              type="button"
              className={`media-button ${
                mediaInputType === "url" ? "active" : ""
              }`}
              onClick={() => handleMediaTypeChange("url")}
            >
              <i className="fas fa-link"></i> URL
            </button>
            <button
              type="button"
              className={`media-button ${
                mediaInputType === "youtube" ? "active" : ""
              }`}
              onClick={() => handleMediaTypeChange("youtube")}
            >
              <i className="fab fa-youtube"></i> YouTube
            </button>
          </div>

          {mediaInputType === "file" && (
            <div className="file-upload-container">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleFileSelect}
              >
                {mediaFile ? "Change File" : "Select File"}
              </button>
              {mediaFile && (
                <span className="selected-file">
                  {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)}{" "}
                  MB)
                </span>
              )}
            </div>
          )}

          {(mediaInputType === "url" || mediaInputType === "youtube") && (
            <div className="url-input-container">
              <input
                type="text"
                name="mediaUrl"
                value={formData.mediaUrl}
                onChange={onChange}
                placeholder={
                  mediaInputType === "youtube"
                    ? "Paste YouTube URL here"
                    : "Enter media URL"
                }
                className="form-control"
              />
            </div>
          )}

          {mediaPreview && (
            <div className="media-preview-container">{mediaPreview}</div>
          )}
        </div>

        <div className="form-group">
          <select
            name="group"
            value={group}
            onChange={onChange}
            className="form-control"
          >
            <option value="">-- Post to your timeline --</option>
            {userGroups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || uploading}
          >
            {loading || uploading
              ? uploading
                ? "Uploading Media..."
                : "Posting..."
              : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;
