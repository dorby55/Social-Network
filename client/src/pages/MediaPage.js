// src/pages/MediaPage.js
import React from "react";
import VideoPlayer from "../components/media/VideoPlayer";
import DrawingCanvas from "../components/media/DrawingCanvas";

const MediaPage = () => {
  return (
    <div className="media-page">
      <h1>Media Features</h1>

      <section className="media-section">
        <h2>Video Player</h2>
        <p>Watch videos with our custom video player component:</p>
        <VideoPlayer
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          autoPlay={false}
          controls={true}
        />
      </section>

      <section className="media-section">
        <h2>Drawing Canvas</h2>
        <p>Create and save your own drawings:</p>
        <DrawingCanvas />
      </section>
    </div>
  );
};

export default MediaPage;
