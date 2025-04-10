import React, { useState, useRef } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { useFfmpeg } from './hooks/useFfmpeg';
import { useMapHandlers } from './hooks/useMapHandlers';
import { useRouteCalculation } from './hooks/useRouteCalculation';
import MapControls from './MapControls';
import BoundaryForm from './BoundaryForm';
import MarkerForm from './MarkerForm';
import BoundaryList from './BoundaryList';
import VideoPlayer from './VideoPlayer';
import StreetViewModal from './StreetViewModal';
import SideBar from '../shared/Sidebar';
import Header from '../shared/Header';

const containerStyle = {
  width: '100%',
  height: '800px',
};

const center = {
  lat: 14.4893,
  lng: 121.0165,
};

const LIBRARIES = ['drawing', 'places', 'geometry'];

const MapComponent = ({ isAuthenticated, setIsAuthenticated }) => {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [boundary, setBoundary] = useState(null);
  const [showStreetView, setShowStreetView] = useState(false);
  const [capturedViews, setCapturedViews] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [showBoundaryList, setShowBoundaryList] = useState(false);

  const { ffmpegLoaded, transcodeImagesToVideo } = useFfmpeg();
  const { 
    optimizedRoute, 
    calculateRoute, 
    clearRoute,
    startPoint,
    endPoint,
    selectMarkerAsStart,
    selectMarkerAsEnd
  } = useRouteCalculation(mapRef, markers);
  
  const { 
    onLoad, 
    startDrawingBoundary, 
    isDrawingBoundary,
    cancelDrawingMode,
    clearAllData,
    showBoundaryForm,
    currentBoundaryPaths,
    handleBoundarySaved,
    handleCancelBoundaryForm,
    loadBoundary,
    selectedBoundary,
    boundaryId,
    showMarkerForm,
    currentMarkerPosition,
    handleMarkerSaved,
    handleCancelMarkerForm,
    markerMode,
    setStartPointMode,
    setEndPointMode,
    cancelPointSelection
  } = useMapHandlers(
    mapRef, 
    boundary, 
    markers, 
    setMarkers, 
    setBoundary,
    selectMarkerAsStart,
    selectMarkerAsEnd
  );

  const tourStreet = () => {
    if (!optimizedRoute) {
      alert("No route available to tour");
      return;
    }
    setShowStreetView(true);
  };

  const handleStreetViewClose = (images, videoUrl, shouldClose = true) => {
    // If images are provided, add them to captured views
    if (images?.length > 0) setCapturedViews(prev => [...prev, ...images]);
    
    // If video URL is provided, update the state to display video player
    if (videoUrl) setVideoUrl(videoUrl);
    
    // Only close the street view if explicitly requested
    if (shouldClose) {
      setShowStreetView(false);
    }
  };

  const handleImageCapture = (image) => {
    console.log("Image captured:", image);
  };

  const handleClearRoute = () => {
    markers.forEach(m => m.setMap(null));
    setMarkers([]);
    clearRoute();
    clearAllData();
    setBoundary(null);
    if (boundary) {
      boundary.setMap(null);
    }
  };

  const handleBoundarySelect = (boundaryData) => {
    loadBoundary(boundaryData);
    setShowBoundaryList(false); // Hide the list after selection
  };

  const toggleBoundaryList = () => {
    setShowBoundaryList(prev => !prev);
  };

  // Add some visual styling for selected markers
  React.useEffect(() => {
    markers.forEach(marker => {
      // Reset all marker icons
      marker.setIcon(null);
      
      // Set icon for start point
      if (marker.id === startPoint) {
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#4CAF50',
          fillOpacity: 1,
          strokeWeight: 0,
          scale: 10
        });
        marker.setLabel('A');
      }
      
      // Set icon for end point
      if (marker.id === endPoint) {
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#F44336',
          fillOpacity: 1,
          strokeWeight: 0,
          scale: 10
        });
        marker.setLabel('B');
      }
    });
  }, [markers, startPoint, endPoint]);

  return (
    <>
      <SideBar 
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
      />
      <div className="main-content">
        <Header />
        <div>
          <MapControls
            boundary={boundary}
            markers={markers}
            optimizedRoute={optimizedRoute}
            startPoint={startPoint}
            endPoint={endPoint}
            startDrawingBoundary={startDrawingBoundary}
            calculateRoute={calculateRoute}
            tourStreet={tourStreet}
            clearRoute={handleClearRoute}
            isDrawingBoundary={isDrawingBoundary}
            cancelDrawingMode={cancelDrawingMode}
            toggleBoundaryList={toggleBoundaryList}
            selectedBoundary={selectedBoundary}
            markerMode={markerMode}
            setStartPointMode={setStartPointMode}
            setEndPointMode={setEndPointMode}
            cancelPointSelection={cancelPointSelection}
          />

          {/* Show active selection mode */}
          {markerMode && (
            <div className="selection-mode-indicator">
              <div className={`mode-${markerMode}`}>
                {markerMode === 'start' ? 'Click on a marker to set it as the starting point (A)' : 
                 'Click on a marker to set it as the ending point (B)'}
              </div>
            </div>
          )}

          {/* Boundary List Overlay */}
          {showBoundaryList && (
            <div className="boundary-list-overlay">
              <div className="boundary-list-container">
                <div className="boundary-list-header">
                  <h3>Select Boundary</h3>
                  <button onClick={() => setShowBoundaryList(false)}>Close</button>
                </div>
                <BoundaryList 
                  onBoundarySelect={handleBoundarySelect}
                  currentBoundaryId={boundaryId}
                />
              </div>
            </div>
          )}

          {showBoundaryForm && (
            <BoundaryForm 
              boundaryPaths={currentBoundaryPaths}
              onSaveComplete={handleBoundarySaved}
              onCancel={handleCancelBoundaryForm}
            />
          )}

          {showMarkerForm && (
            <div className="marker-form-overlay">
              <MarkerForm 
                position={currentMarkerPosition}
                boundaryId={boundaryId}
                onSave={handleMarkerSaved}
                onCancel={handleCancelMarkerForm}
              />
            </div>
          )}

          {showStreetView && (
            <StreetViewModal
              optimizedRoute={optimizedRoute}
              onClose={handleStreetViewClose}
              onCapture={handleImageCapture}
              transcodeImagesToVideo={transcodeImagesToVideo}
            />
          )}

          {videoUrl && <VideoPlayer videoUrl={videoUrl} />}

          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={LIBRARIES}
          >
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={20}
              onLoad={onLoad}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
              }}
            />
          </LoadScript>
        </div>
      </div>
    </>
  );
};

export default MapComponent;