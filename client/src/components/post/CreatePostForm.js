import { useState } from "react";
import { createPost, uploadPostMedia } from "../../services/api";
import DrawingCanvas from "../media/DrawingCanvas";

const CreatePostForm = ({ groupId, onPostCreated }) => {
  const [postText, setPostText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState("none");
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    if (file.type.startsWith("image/")) {
      setMediaType("image");
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else {
      alert("Please select an image or video file");
      return;
    }

    setMediaFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("none");
    const fileInput = document.getElementById("media-upload");
    if (fileInput) fileInput.value = "";
  };

  const handleDrawingSave = (drawingFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target.result);
      setMediaType("image");
      setMediaFile(drawingFile);
      setShowDrawing(false);
    };
    reader.readAsDataURL(drawingFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!postText.trim() && !mediaFile) {
      alert("Please enter some text or select a photo/video for your post");
      return;
    }

    try {
      setLoading(true);

      let mediaUrl = "";

      if (mediaFile) {
        setUploadingMedia(true);
        try {
          const mediaResponse = await uploadPostMedia(mediaFile);
          mediaUrl = mediaResponse.mediaUrl;
        } catch (error) {
          alert("Failed to upload media. Please try again.");
          return;
        } finally {
          setUploadingMedia(false);
        }
      }

      const postData = {
        text: postText.trim() || " ",
        group: groupId,
        mediaType: mediaType,
        mediaUrl: mediaUrl,
      };

      console.log("Creating post with data:", postData);

      const newPost = await createPost(postData);
      console.log("Post created successfully:", newPost);

      setPostText("");
      removeMedia();

      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (error) {
      console.error("Error creating post:", error);

      if (error.response?.data?.msg) {
        alert(error.response.data.msg);
      } else {
        alert("Error creating post. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-form">
      <form onSubmit={handleSubmit}>
        <textarea
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          placeholder={
            mediaFile
              ? "Say something about this... (optional)"
              : "What's on your mind?"
          }
          maxLength="1000"
          rows="3"
          className="post-textarea"
          disabled={loading}
        />

        {mediaPreview && (
          <div className="media-preview">
            {mediaType === "image" ? (
              <img src={mediaPreview} alt="Preview" className="preview-image" />
            ) : (
              <video src={mediaPreview} className="preview-video" controls />
            )}
            <button
              type="button"
              className="remove-media-btn"
              onClick={removeMedia}
              disabled={loading}
            >
              ×
            </button>
          </div>
        )}

        <div className="form-footer">
          <div className="form-actions">
            <label htmlFor="media-upload" className="media-upload-btn">
              <i className="fas fa-camera"></i>
              Photo/Video
            </label>
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              style={{ display: "none" }}
              disabled={loading}
            />

            <button
              type="button"
              className="media-upload-btn drawing-btn"
              onClick={() => setShowDrawing(true)}
              disabled={loading}
              title="Create Drawing"
            >
              <i className="fas fa-paint-brush"></i>
              Draw
            </button>
          </div>

          <div className="form-info">
            <small className="character-count">
              {postText.length}/1000 characters
            </small>
            <button
              type="submit"
              disabled={loading || (!postText.trim() && !mediaFile)}
              className="btn btn-primary"
            >
              {loading
                ? uploadingMedia
                  ? "Uploading..."
                  : "Posting..."
                : "Post"}
            </button>
          </div>
        </div>
      </form>

      <DrawingCanvas
        isOpen={showDrawing}
        onSave={handleDrawingSave}
        onCancel={() => setShowDrawing(false)}
      />
    </div>
  );
};

export default CreatePostForm;
