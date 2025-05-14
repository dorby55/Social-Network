// src/components/media/DrawingCanvas.js
import React, { useRef, useState, useEffect } from "react";

const DrawingCanvas = ({
  width = 600,
  height = 400,
  brushSize = 5,
  brushColor = "#000000",
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBrushSize, setCurrentBrushSize] = useState(brushSize);
  const [currentColor, setCurrentColor] = useState(brushColor);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set initial canvas properties
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = currentBrushSize;
    context.strokeStyle = currentColor;

    // Clear canvas and set background to white
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    if (historyIndex === -1) {
      const initialState = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      setDrawingHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [currentBrushSize, currentColor, historyIndex]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);

    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (isDrawing) {
      context.closePath();
      setIsDrawing(false);

      // Save current state to history
      const currentState = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      const newHistory = [
        ...drawingHistory.slice(0, historyIndex + 1),
        currentState,
      ];
      setDrawingHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setCurrentColor(newColor);

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.strokeStyle = newColor;
  };

  const handleBrushSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setCurrentBrushSize(newSize);

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.lineWidth = newSize;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Save cleared state to history
    const clearedState = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    const newHistory = [
      ...drawingHistory.slice(0, historyIndex + 1),
      clearedState,
    ];
    setDrawingHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      const newIndex = historyIndex - 1;
      context.putImageData(drawingHistory[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      const newIndex = historyIndex + 1;
      context.putImageData(drawingHistory[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    const imageUrl = canvas.toDataURL("image/png");

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "drawing.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="canvas-container">
      <div className="canvas-tools">
        <div className="tool-group">
          <label htmlFor="colorPicker">Color:</label>
          <input
            type="color"
            id="colorPicker"
            value={currentColor}
            onChange={handleColorChange}
            className="color-picker"
          />
        </div>

        <div className="tool-group">
          <label htmlFor="brushSize">Size:</label>
          <input
            type="range"
            id="brushSize"
            min="1"
            max="50"
            value={currentBrushSize}
            onChange={handleBrushSizeChange}
            className="brush-size-slider"
          />
          <span>{currentBrushSize}px</span>
        </div>

        <div className="tool-group button-group">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="tool-button"
          >
            <i className="fas fa-undo"></i> Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= drawingHistory.length - 1}
            className="tool-button"
          >
            <i className="fas fa-redo"></i> Redo
          </button>
          <button onClick={clearCanvas} className="tool-button">
            <i className="fas fa-trash"></i> Clear
          </button>
          <button onClick={saveDrawing} className="tool-button save-button">
            <i className="fas fa-download"></i> Save
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="drawing-canvas"
      />
    </div>
  );
};

export default DrawingCanvas;
