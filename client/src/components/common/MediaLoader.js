// src/components/common/MediaLoader.js
import React, { useState } from "react";

const MediaLoader = ({ type, url, className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!url) {
    return null;
  }

  if (hasError) {
    return (
      <div className="media-error-message">
        <i className="fas fa-exclamation-circle"></i>
        Media attachment unavailable
      </div>
    );
  }

  return (
    <div className={`media-container ${className || ""}`}>
      {isLoading && (
        <div className="media-loader">
          <div className="spinner"></div>
        </div>
      )}

      {type === "image" ? (
        <img
          src={url}
          alt="Post attachment"
          className={`post-image ${isLoading ? "loading" : "loaded"}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : type === "video" ? (
        <video
          controls
          className={`post-video ${isLoading ? "loading" : "loaded"}`}
          onLoadedData={handleLoad}
          onError={handleError}
        >
          <source src={url} />
          Your browser does not support the video tag.
        </video>
      ) : null}
    </div>
  );
};

export default MediaLoader;
