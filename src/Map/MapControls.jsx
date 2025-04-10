import React from 'react';
import'./css/MapControls.css';

const MapControls = ({
  boundary,
  markers,
  optimizedRoute,
  startPoint,
  endPoint,
  startDrawingBoundary,
  calculateRoute,
  tourStreet,
  clearRoute,
  isDrawingBoundary,
  cancelDrawingMode,
  toggleBoundaryList,
  selectedBoundary,
  markerMode,
  setStartPointMode,
  setEndPointMode,
  cancelPointSelection
}) => {
  return (
    <div className="map-controls">
      <div className="control-group">
        <h3>Boundary</h3>
        <button 
          onClick={startDrawingBoundary}
          disabled={isDrawingBoundary}
        >
          Draw Boundary
        </button>
        {isDrawingBoundary && (
          <button 
            onClick={cancelDrawingMode}
            className="cancel-button"
          >
            Cancel Drawing
          </button>
        )}
        <button onClick={toggleBoundaryList}>
          Select Boundary
        </button>
        {selectedBoundary && (
          <div className="selected-boundary-info">
            <span>Current: {selectedBoundary.name}</span>
          </div>
        )}
      </div>
      
      <div className="control-group">
        <h3>Route Points</h3>
        <button 
          onClick={setStartPointMode}
          className={markerMode === 'start' ? 'active-mode' : ''}
          disabled={!boundary || markers.length === 0}
        >
          Select Start Point (A)
        </button>
        <button 
          onClick={setEndPointMode}
          className={markerMode === 'end' ? 'active-mode' : ''}
          disabled={!boundary || markers.length === 0}
        >
          Select End Point (B)
        </button>
        {markerMode && (
          <button 
            onClick={cancelPointSelection}
            className="cancel-button"
          >
            Cancel Selection
          </button>
        )}
        
        <div className="selected-points-info">
          {startPoint && <div>Start Point: {startPoint}</div>}
          {endPoint && <div>End Point: {endPoint}</div>}
        </div>
      </div>
      
      <div className="control-group">
        <h3>Route</h3>
        <button 
          onClick={calculateRoute}
          disabled={!boundary || !startPoint || !endPoint}
        >
          Calculate Route
        </button>
        <button 
          onClick={tourStreet}
          disabled={!optimizedRoute}
        >
          Street View Tour
        </button>
      </div>
      
      <div className="control-group">
        <h3>Actions</h3>
        <button 
          onClick={clearRoute}
          className="clear-button"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default MapControls;