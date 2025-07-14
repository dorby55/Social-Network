import { useRef, useState, useEffect } from "react";

const DrawingCanvas = ({ onSave, onCancel, isOpen }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState("pen");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentSize, setCurrentSize] = useState(3);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = 600;
      canvas.height = 400;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      saveState();
    }
  }, [isOpen]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      const newHistory = canvasHistory.slice(0, historyIndex + 1);
      newHistory.push(dataUrl);
      setCanvasHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getTouchPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const pos = e.type.includes("touch") ? getTouchPos(e) : getMousePos(e);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (currentTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = e.type.includes("touch") ? getTouchPos(e) : getMousePos(e);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "drawing.png", { type: "image/png" });
        onSave(file);
      },
      "image/png",
      0.9
    );
  };

  if (!isOpen) return null;

  return (
    <div className="drawing-modal">
      <div className="drawing-container">
        <div className="drawing-header">
          <h3>Create Drawing</h3>
          <button className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="drawing-toolbar">
          <div className="tool-group">
            <button
              className={`tool-btn ${currentTool === "pen" ? "active" : ""}`}
              onClick={() => setCurrentTool("pen")}
              title="Pen"
            >
              ✏️
            </button>
            <button
              className={`tool-btn ${currentTool === "eraser" ? "active" : ""}`}
              onClick={() => setCurrentTool("eraser")}
              title="Eraser"
            >
              🧹
            </button>
          </div>

          <div className="tool-group">
            <label htmlFor="color-picker">Color:</label>
            <input
              id="color-picker"
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="color-picker"
            />
          </div>

          <div className="tool-group">
            <label htmlFor="size-slider">Size:</label>
            <input
              id="size-slider"
              type="range"
              min="1"
              max="20"
              value={currentSize}
              onChange={(e) => setCurrentSize(parseInt(e.target.value))}
              className="size-slider"
            />
            <span className="size-display">{currentSize}px</span>
          </div>

          <div className="tool-group">
            <button
              className="tool-btn"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              ↶
            </button>
            <button
              className="tool-btn"
              onClick={redo}
              disabled={historyIndex >= canvasHistory.length - 1}
              title="Redo"
            >
              ↷
            </button>
            <button className="tool-btn" onClick={clearCanvas} title="Clear">
              🗑️
            </button>
          </div>
        </div>

        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="drawing-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Drawing
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
