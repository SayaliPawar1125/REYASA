
import React, { useCallback, useEffect, useState } from "react";
import reyasaBackground from "../assets/reyasa-background.png";

const API_URL = "http://localhost:8080/api";

const emptyForm = {
  title: "",
  description: "",
  displayOrder: 0,
  active: true,
};

function HomepageVideos() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const token = localStorage.getItem("token");

  const getHeaders = useCallback(
    (multipart = false) => {
      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Do not set Content-Type for FormData.
      // The browser must add the multipart boundary automatically.
      if (!multipart) {
        headers["Content-Type"] = "application/json";
      }

      return headers;
    },
    [token]
  );

  const handleResponse = async (response) => {
    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`;

      throw new Error(errorMessage);
    }

    return data;
  };

  const getMediaUrl = (path) => {
    if (!path) return "";

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${API_URL.replace("/api", "")}${
      path.startsWith("/") ? "" : "/"
    }${path}`;
  };

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/videos`, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await handleResponse(response);

      const videoList = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];

      setVideos(videoList);
    } catch (err) {
      setError(err.message || "Unable to load homepage videos.");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const resetForm = () => {
    setForm(emptyForm);
    setVideoFile(null);
    setPosterFile(null);
    setEditingId(null);
    setShowForm(false);

    const videoInput = document.getElementById("homepageVideoFile");
    const posterInput = document.getElementById("homepagePosterFile");

    if (videoInput) videoInput.value = "";
    if (posterInput) posterInput.value = "";
  };

  const openAddForm = () => {
    setError("");
    setMessage("");

    // Only one video record is allowed, even if it is inactive.
    if (videos.length > 0) {
      setError(
        "Only one homepage video is allowed. Edit or delete the existing video first."
      );
      return;
    }

    setForm(emptyForm);
    setVideoFile(null);
    setPosterFile(null);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (video) => {
    setError("");
    setMessage("");

    setEditingId(video.id);
    setForm({
      title: video.title || "",
      description: video.description || "",
      displayOrder: video.displayOrder ?? 0,
      active: video.active ?? true,
    });

    setVideoFile(null);
    setPosterFile(null);
    setShowForm(true);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveVideo = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Please enter a video title.");
      return;
    }

    if (!editingId && videos.length > 0) {
      setError(
        "Only one homepage video is allowed. Delete the existing video before uploading another."
      );
      return;
    }

    if (!editingId && !videoFile) {
      setError("Please select a video file from your laptop.");
      return;
    }

    if (
      videoFile &&
      !videoFile.type.startsWith("video/") &&
      !/\.(mp4|webm|ogg|mov)$/i.test(videoFile.name)
    ) {
      setError("Please select a valid video file.");
      return;
    }

    if (
      posterFile &&
      !posterFile.type.startsWith("image/")
    ) {
      setError("Please select a valid poster image.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("displayOrder", String(form.displayOrder || 0));
      formData.append("active", String(form.active));

      if (videoFile) {
        formData.append("videoFile", videoFile);
      }

      if (posterFile) {
        formData.append("posterFile", posterFile);
      }

      const url = editingId
        ? `${API_URL}/admin/videos/${editingId}/upload`
        : `${API_URL}/admin/videos/upload`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: getHeaders(true),
        body: formData,
      });

      await handleResponse(response);

      setMessage(
        editingId
          ? "Homepage video updated successfully."
          : "Homepage video uploaded successfully."
      );

      resetForm();
      await loadVideos();
    } catch (err) {
      setError(err.message || "Unable to save the homepage video.");
    } finally {
      setSaving(false);
    }
  };

  const toggleVideoStatus = async (video) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/admin/videos/${video.id}/status`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            active: !video.active,
          }),
        }
      );

      await handleResponse(response);

      setMessage(
        `Homepage video ${
          !video.active ? "activated" : "deactivated"
        } successfully.`
      );

      await loadVideos();
    } catch (err) {
      setError(err.message || "Unable to change video status.");
    }
  };

  const deleteVideo = async (video) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${video.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/admin/videos/${video.id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      await handleResponse(response);

      if (editingId === video.id) {
        resetForm();
      }

      setMessage("Homepage video deleted successfully.");
      await loadVideos();
    } catch (err) {
      setError(err.message || "Unable to delete the homepage video.");
    }
  };

  const filteredVideos = videos.filter((video) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      (video.title || "").toLowerCase().includes(searchText) ||
      (video.description || "").toLowerCase().includes(searchText);

    const matchesFilter =
      filter === "All" ||
      (filter === "Active" && video.active) ||
      (filter === "Inactive" && !video.active);

    return matchesSearch && matchesFilter;
  });

  const activeCount = videos.filter((video) => video.active).length;
  const inactiveCount = videos.length - activeCount;

  return (
    <div
      className="min-vh-100 py-4 mt-5"
      style={{
        backgroundImage: `url(${reyasaBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="container-fluid px-3 px-md-4 pt-4 pb-5">
        {/* Page heading */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#800000" }}>
              <i className="bi bi-camera-reels-fill me-2"></i>
              Homepage Videos
            </h2>
            <p className="text-secondary mb-0">
              Manage the video displayed on the REYASA customer homepage.
            </p>
          </div>

          <button
            type="button"
            className="btn text-white fw-semibold"
            style={{ backgroundColor: "#800000" }}
            onClick={openAddForm}
            disabled={videos.length > 0}
            title={
              videos.length > 0
                ? "Edit or delete the existing video first"
                : "Upload a homepage video"
            }
          >
            <i className="bi bi-cloud-arrow-up-fill me-2"></i>
            Upload Homepage Video
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setError("")}
            ></button>
          </div>
        )}

        {message && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            <i className="bi bi-check-circle-fill me-2"></i>
            {message}
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setMessage("")}
            ></button>
          </div>
        )}

        {/* Statistics */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="rounded-circle bg-light p-3">
                  <i
                    className="bi bi-camera-video-fill fs-3"
                    style={{ color: "#800000" }}
                  ></i>
                </div>
                <div>
                  <p className="text-secondary mb-1">Total Videos</p>
                  <h3 className="fw-bold mb-0">{videos.length}</h3>
                  <small className="text-secondary">
                    Maximum allowed: 1
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="rounded-circle bg-light p-3">
                  <i className="bi bi-check-circle-fill text-success fs-3"></i>
                </div>
                <div>
                  <p className="text-secondary mb-1">Active Videos</p>
                  <h3 className="fw-bold mb-0">{activeCount}</h3>
                  <small className="text-secondary">
                    Visible on homepage
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="rounded-circle bg-light p-3">
                  <i className="bi bi-pause-circle-fill text-secondary fs-3"></i>
                </div>
                <div>
                  <p className="text-secondary mb-1">Inactive Videos</p>
                  <h3 className="fw-bold mb-0">{inactiveCount}</h3>
                  <small className="text-secondary">
                    Hidden from homepage
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <div className="card border-0 shadow-sm mb-4">
            <div
              className="card-header text-white py-3"
              style={{ backgroundColor: "#800000" }}
            >
              <h5 className="mb-0 fw-semibold">
                <i
                  className={`bi ${
                    editingId ? "bi-pencil-square" : "bi-cloud-upload-fill"
                  } me-2`}
                ></i>
                {editingId ? "Edit Homepage Video" : "Upload Homepage Video"}
              </h5>
            </div>

            <div className="card-body p-3 p-md-4">
              <form onSubmit={saveVideo}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="videoTitle" className="form-label fw-semibold">
                      Video Title <span className="text-danger">*</span>
                    </label>
                    <input
                      id="videoTitle"
                      name="title"
                      type="text"
                      className="form-control"
                      placeholder="Enter video title"
                      value={form.title}
                      onChange={handleInputChange}
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="displayOrder"
                      className="form-label fw-semibold"
                    >
                      Display Order
                    </label>
                    <input
                      id="displayOrder"
                      name="displayOrder"
                      type="number"
                      className="form-control"
                      min="0"
                      value={form.displayOrder}
                      onChange={handleInputChange}
                    />
                    <div className="form-text">
                      Keep 0 if you do not need a specific order.
                    </div>
                  </div>

                  <div className="col-12">
                    <label
                      htmlFor="videoDescription"
                      className="form-label fw-semibold"
                    >
                      Description
                    </label>
                    <textarea
                      id="videoDescription"
                      name="description"
                      className="form-control"
                      rows="3"
                      placeholder="Enter a short description"
                      value={form.description}
                      onChange={handleInputChange}
                      maxLength={1000}
                    ></textarea>
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="homepageVideoFile"
                      className="form-label fw-semibold"
                    >
                      Video File{" "}
                      {!editingId && <span className="text-danger">*</span>}
                    </label>
                    <input
                      id="homepageVideoFile"
                      type="file"
                      className="form-control"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,.mov"
                      required={!editingId}
                      onChange={(event) =>
                        setVideoFile(event.target.files?.[0] || null)
                      }
                    />
                    <div className="form-text">
                      {editingId
                        ? "Optional. Select a new file to replace the current video."
                        : "Select a video from your laptop. MP4 is recommended."}
                    </div>

                    {videoFile && (
                      <div className="small text-success mt-2">
                        <i className="bi bi-file-earmark-play me-1"></i>
                        {videoFile.name} (
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      htmlFor="homepagePosterFile"
                      className="form-label fw-semibold"
                    >
                      Poster Image (Optional)
                    </label>
                    <input
                      id="homepagePosterFile"
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(event) =>
                        setPosterFile(event.target.files?.[0] || null)
                      }
                    />
                    <div className="form-text">
                      Used as the video poster before playback.
                    </div>

                    {posterFile && (
                      <div className="small text-success mt-2">
                        <i className="bi bi-image me-1"></i>
                        {posterFile.name}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input
                        id="videoActive"
                        name="active"
                        type="checkbox"
                        className="form-check-input"
                        checked={form.active}
                        onChange={handleInputChange}
                      />
                      <label
                        htmlFor="videoActive"
                        className="form-check-label fw-semibold"
                      >
                        Active — show this video on the customer homepage
                      </label>
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-wrap gap-2 pt-2">
                    <button
                      type="submit"
                      className="btn text-white fw-semibold"
                      style={{ backgroundColor: "#800000" }}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            aria-hidden="true"
                          ></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save-fill me-2"></i>
                          {editingId ? "Save Changes" : "Upload Video"}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search and filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-8">
                <label htmlFor="videoSearch" className="form-label fw-semibold">
                  Search Videos
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    id="videoSearch"
                    type="search"
                    className="form-control"
                    placeholder="Search by title or description..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label htmlFor="videoFilter" className="form-label fw-semibold">
                  Status
                </label>
                <select
                  id="videoFilter"
                  className="form-select"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="All">All Videos</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Video list */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h5 className="mb-0 fw-bold" style={{ color: "#800000" }}>
              Uploaded Homepage Video
            </h5>
            <span className="badge text-bg-secondary">
              {filteredVideos.length} result(s)
            </span>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border"
                  style={{ color: "#800000" }}
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-secondary mt-3 mb-0">
                  Loading homepage videos...
                </p>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-5 px-3">
                <i className="bi bi-camera-video fs-1 text-secondary"></i>
                <h5 className="mt-3">No homepage video found</h5>
                <p className="text-secondary mb-3">
                  {videos.length === 0
                    ? "Upload one video to display it on the customer homepage."
                    : "No videos match your current search or filter."}
                </p>

                {videos.length === 0 && (
                  <button
                    type="button"
                    className="btn text-white"
                    style={{ backgroundColor: "#800000" }}
                    onClick={openAddForm}
                  >
                    <i className="bi bi-cloud-upload me-2"></i>
                    Upload First Video
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-3">Preview</th>
                      <th>Video Details</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredVideos.map((video) => {
                      const videoUrl = getMediaUrl(video.videoUrl);
                      const posterUrl = getMediaUrl(video.posterImageUrl);

                      return (
                        <tr key={video.id}>
                          <td className="px-3">
                            {videoUrl ? (
                              <video
                                src={videoUrl}
                                poster={posterUrl || undefined}
                                controls
                                preload="metadata"
                                className="rounded border bg-dark"
                                width="180"
                                height="105"
                              >
                                Your browser does not support video playback.
                              </video>
                            ) : (
                              <div
                                className="bg-light rounded border d-flex align-items-center justify-content-center"
                                style={{ width: "180px", height: "105px" }}
                              >
                                <i className="bi bi-camera-video fs-2 text-secondary"></i>
                              </div>
                            )}
                          </td>

                          <td>
                            <div className="fw-semibold">{video.title}</div>
                            <div
                              className="small text-secondary text-break"
                            >
                              {video.description || "No description"}
                            </div>
                            {video.createdAt && (
                              <div className="small text-secondary mt-1">
                                Uploaded:{" "}
                                {new Date(video.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>

                          <td>{video.displayOrder ?? 0}</td>

                          <td>
                            <span
                              className={`badge ${
                                video.active ? "text-bg-success" : "text-bg-secondary"
                              }`}
                            >
                              {video.active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <div className="d-flex justify-content-center flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                title="Edit or replace video"
                                onClick={() => openEditForm(video)}
                              >
                                <i className="bi bi-pencil-square me-1"></i>
                                Edit
                              </button>

                              <button
                                type="button"
                                className={`btn btn-sm ${
                                  video.active
                                    ? "btn-outline-secondary"
                                    : "btn-outline-success"
                                }`}
                                title={
                                  video.active
                                    ? "Deactivate video"
                                    : "Activate video"
                                }
                                onClick={() => toggleVideoStatus(video)}
                              >
                                <i
                                  className={`bi ${
                                    video.active
                                      ? "bi-pause-circle"
                                      : "bi-play-circle"
                                  } me-1`}
                                ></i>
                                {video.active ? "Deactivate" : "Activate"}
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                title="Delete video"
                                onClick={() => deleteVideo(video)}
                              >
                                <i className="bi bi-trash-fill me-1"></i>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card-footer bg-white text-secondary small">
            <i className="bi bi-info-circle me-2"></i>
            Only one video record is allowed. An active video is eligible to
            appear on the customer homepage. Deactivating it hides it without
            deleting it.
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomepageVideos;
