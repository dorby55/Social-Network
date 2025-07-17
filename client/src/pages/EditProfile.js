import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} from "../services/api";

const EditProfile = () => {
  const { currentUser, updateProfilePicture } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        if (!currentUser) return;

        const profile = await getUserProfile(currentUser._id);
        setFormData({
          username: profile.username || "",
          email: profile.email || "",
          bio: profile.bio || "",
        });

        if (profile.profilePicture) {
          setProfileImageUrl(profile.profilePicture);
        }

        setError(null);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Error loading profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [currentUser]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    setProfileImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!profileImage) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadProfilePicture(profileImage);

      if (result.success && result.profilePicture) {
        let imageUrl = result.profilePicture;

        if (imageUrl.startsWith("/") && !imageUrl.startsWith("//")) {
          const baseUrl = window.location.origin;
          imageUrl = `${baseUrl}${imageUrl}`;
        }

        const timestamp = new Date().getTime();
        const cachedImageUrl = `${imageUrl}?t=${timestamp}`;

        setProfileImageUrl(cachedImageUrl);

        updateProfilePicture(cachedImageUrl);

        setSuccessMessage("Profile picture uploaded successfully!");

        fileInputRef.current.value = "";
        setProfileImage(null);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError("Error uploading profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePicture = async () => {
    if (
      !window.confirm("Are you sure you want to delete your profile picture?")
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteProfilePicture();

      if (result.success) {
        setProfileImageUrl("");
        updateProfilePicture("");

        setSuccessMessage("Profile picture deleted successfully!");
      } else {
        throw new Error("Failed to delete profile picture");
      }
    } catch (err) {
      console.error("Error deleting profile picture:", err);
      setError("Error deleting profile picture. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    setUpdating(true);
    setSuccessMessage(null);

    try {
      if (profileImage) {
        await handleUpload();
      }

      const updateData = {
        bio: formData.bio,
      };

      await updateUserProfile(currentUser._id, updateData);

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => {
        navigate(`/profile/${currentUser._id}`);
      }, 2000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Error updating profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="edit-profile-page">
      <div className="page-header">
        <h1>Edit Profile</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="form-group profile-picture-group">
              <label>Profile Picture</label>
              <div className="profile-picture-upload">
                <div
                  className={`profile-picture-preview ${
                    imageLoading ? "loading" : ""
                  }`}
                >
                  {imageLoading && (
                    <div className="image-loading-overlay">
                      <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                      </div>
                    </div>
                  )}
                  <img
                    key={profileImageUrl}
                    src={profileImageUrl || "/default-avatar.png"}
                    alt="Profile Preview"
                    className="profile-preview-img"
                    onLoad={() => setImageLoading(false)}
                    onError={(e) => {
                      console.error("Error loading image:", profileImageUrl);
                      e.target.src = "/default-avatar.png";
                      e.target.onerror = null;
                      setImageLoading(false);
                    }}
                  />
                </div>
                <div className="profile-picture-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleFileSelect}
                  >
                    Choose File
                  </button>
                  {profileImage && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                  )}
                  {profileImageUrl && !profileImage && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDeletePicture}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Delete Picture"}
                    </button>
                  )}
                </div>
                <small className="form-text text-muted">
                  Upload an image (max 5MB). Recommended size: 300x300 pixels.
                </small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                disabled
                className="form-control disabled"
              />
              <small className="form-text text-muted">
                Username cannot be changed
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="form-control disabled"
              />
              <small className="form-text text-muted">
                Email cannot be changed
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={onChange}
                placeholder="Tell us about yourself"
                rows="4"
                className="form-control"
              ></textarea>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/profile/${currentUser._id}`)}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updating || uploading}
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
