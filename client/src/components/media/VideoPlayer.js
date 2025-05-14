// src/components/media/VideoPlayer.js
import React, { useRef, useState, useEffect } from "react";

const VideoPlayer = ({
  src,
  autoPlay = false,
  controls = true,
  width = "100%",
  height = "auto",
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    // Add event listeners
    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Remove event listeners on cleanup
    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const videoElement = videoRef.current;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }

    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const value = e.target.value;
    setVolume(value);
    videoRef.current.volume = value;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const percent = e.nativeEvent.offsetX / progressBar.offsetWidth;
    const newTime = percent * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div
      className="video-container"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        width={width}
        height={height}
        onClick={togglePlay}
        autoPlay={autoPlay}
        controls={controls}
      />

      {controls && showControls && (
        <div className="custom-video-controls">
          <div className="progress-container" onClick={handleProgressClick}>
            <div className="progress-bar">
              <div
                className="progress-filled"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="controls-row">
            <button onClick={togglePlay} className="control-button">
              {isPlaying ? (
                <i className="fas fa-pause"></i>
              ) : (
                <i className="fas fa-play"></i>
              )}
            </button>

            <div className="volume-control">
              <i
                className={`fas fa-volume-${
                  volume > 0 ? (volume > 0.5 ? "up" : "down") : "mute"
                }`}
              ></i>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
