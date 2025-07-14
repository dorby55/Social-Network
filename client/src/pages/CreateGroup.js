import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { createGroup } from "../services/api";

const CreateGroup = () => {
  const { currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const { name, description, isPrivate } = formData;

  const onChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      setError("Please enter all required fields");
      return;
    }

    setLoading(true);

    try {
      const newGroup = await createGroup(formData);
      navigate(`/groups/${newGroup._id}`);
    } catch (err) {
      setError("Error creating group. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="create-group-page">
      <div className="page-header">
        <h1>Create a New Group</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="name">Group Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="Enter group name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={onChange}
                placeholder="What is this group about?"
                rows="4"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <div className="checkbox">
                <input
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  checked={isPrivate}
                  onChange={onChange}
                />
                <label htmlFor="isPrivate">Make this group private</label>
              </div>
              <small className="form-text">
                Private groups are only visible to members and require admin
                approval to join.
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
