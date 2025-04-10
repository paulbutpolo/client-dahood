import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  GoogleMap,
  LoadScript,
} from '@react-google-maps/api';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import StreetViewTour from './StreetViewTour';

const ffmpeg = createFFmpeg({ log: true });

const API = 'http://localhost:5000/api';

const containerStyle = {
  width: '100%',
  height: '600px',
};

const center = {
  lat: 14.4893,
  lng: 121.0165,
};

const MapComponent = () => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [boundary, setBoundary] = useState(null);
  const [markers, setMarkers] = useState([]);
  // const [currentRoute, setCurrentRoute] = useState(null);
  
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [showStreetView, setShowStreetView] = useState(false);
  const [capturedViews, setCapturedViews] = useState([]);
  
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  useEffect(() => {
    const loadFfmpeg = async () => {
      await ffmpeg.load();
      setFfmpegLoaded(true);
    };
    loadFfmpeg();
  }, []);

  const transcodeImagesToVideo = async (images) => {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    
    try {
      // How many times to duplicate each frame (makes the video slower)
      const frameDuplication = 15; // Each image will stay on screen for half a second at 30fps
      let frameCount = 0;
      
      // Write each image to FFmpeg's file system multiple times
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        
        try {
            const response = await fetch(imageUrl);
            
            if (!response.ok) {
                console.error(`Failed to fetch image ${i}: ${response.status} ${response.statusText}`);
                continue;
            }
            
            const blob = await response.blob();
            console.log(`Image ${i} size: ${blob.size} bytes`);
            
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Write this same image multiple times with sequential frame numbers
            for (let j = 0; j < frameDuplication; j++) {
                ffmpeg.FS('writeFile', `frame_${frameCount.toString().padStart(5, '0')}.jpg`, uint8Array);
                frameCount++;
            }
        } catch (error) {
            console.error(`Error processing image ${i}:`, error);
        }
      }
  
      // Run FFmpeg command to create a video with a slower frame rate
      await ffmpeg.run(
        '-framerate', '30', // Keep the standard frame rate
        '-i', 'frame_%05d.jpg', // Input file pattern
        '-c:v', 'libx264', // Video codec
        '-pix_fmt', 'yuv420p', // Pixel format
        '-preset', 'slow', // Better quality
        '-crf', '18', // High quality (lower values = higher quality)
        'output.mp4' // Output file
      );
  
      // Read the output video file
      const data = ffmpeg.FS('readFile', 'output.mp4');
      const videoUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  
      return videoUrl;
    } catch (error) {
      console.error('Error during transcoding:', error);
      throw error;
    }
  };

  const onLoad = useCallback((map) => {
    setMapInstance(map);
    mapRef.current = map;

    const drawing = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#FF9800',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FF9800',
        editable: true,
        zIndex: 1,
      },
    });

    drawing.setMap(map);
    setDrawingManager(drawing);

    window.google.maps.event.clearListeners(map, 'click');

    map.addListener('click', (e) => {
      console.log('Map clicked at:', e.latLng.lat(), e.latLng.lng()); // Debug log
      if (!isDrawingBoundary) {
        addMarker(e.latLng);
      }
    });
  }, [isDrawingBoundary, boundary]);

  const isMarkerInPolygon = (marker, polygon) => {
    const markerPosition = marker.getPosition();
    return window.google.maps.geometry.poly.containsLocation(markerPosition, polygon);
  };

  const addMarker = (location) => {
    console.log('Adding marker at:', location.lat(), location.lng()); // Debug log
    // Check if a marker already exists at this position
    const existingMarker = markers.find(m => {
      const pos = m.getPosition();
      return pos.lat() === location.lat() && pos.lng() === location.lng();
    });
  
    if (existingMarker) {
      console.log('Marker already exists at this position');
      return;
    }
  
    // Rest of your addMarker implementation
    const marker = new window.google.maps.Marker({
      position: location,
      map: mapRef.current,
      draggable: true,
    });
  
    if (boundary) {
      marker.addListener('dragend', () => {
        const newPos = marker.getPosition();
        if (!isMarkerInPolygon(marker, boundary)) {
          alert("Marker must remain within the boundary");
          marker.setPosition(location);
        }
      });
    }
  
    setMarkers(prev => [...prev, marker]);
  };

  const startDrawingBoundary = () => {
    if (!drawingManager) return;

    if (boundary) {
      boundary.setMap(null);
      setBoundary(null);
    }

    setIsDrawingBoundary(true);
    drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);

    window.google.maps.event.addListenerOnce(drawingManager, 'polygoncomplete', (polygon) => {
      // Get the polygon path coordinates
      const paths = polygon.getPath();
      const coordinates = [];
      
      paths.forEach((latLng, index) => {
        coordinates.push({
          lat: latLng.lat(),
          lng: latLng.lng()
        });
      });
      
      // Get style properties if needed
      const boundaryData = {
        coordinates: coordinates,
        strokeColor: polygon.get('strokeColor'),
        strokeOpacity: polygon.get('strokeOpacity'),
        strokeWeight: polygon.get('strokeWeight'),
        fillColor: polygon.get('fillColor'),
        fillOpacity: polygon.get('fillOpacity')
      };
      
      // Now you can store boundaryData in your database
      console.log('Boundary data to store:', boundaryData);
      
      // Rest of your existing code...
      setBoundary(polygon);
      drawingManager.setDrawingMode(null);
      setIsDrawingBoundary(false);
      
      const validMarkers = markers.filter(marker => {
        const inside = isMarkerInPolygon(marker, polygon);
        if (!inside) marker.setMap(null);
        return inside;
      });
      
      setMarkers(validMarkers);
    });
  };

  const calculateRoute = async () => {
    if (markers.length < 2) {
      alert("Need at least 2 markers to calculate a route");
      return;
    }

    try {
      const sortedMarkers = [...markers];

      console.log("All markers:", sortedMarkers.map(m => ({
        lat: m.getPosition().lat(),
        lng: m.getPosition().lng()
      })));

      const origin = {
        lat: sortedMarkers[0].getPosition().lat(),
        lng: sortedMarkers[0].getPosition().lng()
      };

      const destination = {
        lat: sortedMarkers[sortedMarkers.length - 1].getPosition().lat(),
        lng: sortedMarkers[sortedMarkers.length - 1].getPosition().lng()
      };

      const waypoints = sortedMarkers.length > 2 
        ? sortedMarkers.slice(1, -1).map(marker => ({
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng()
          }))
        : [];
        
      console.log("Waypoints:", waypoints);

      const response = await fetch(`${API}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, waypoints })
      });
      
      const result = await response.json();

      if (result.status === "OK") {
        // Store result in state
        setOptimizedRoute(result);
        
        // Draw the route on the map
        if (result.routes && result.routes.length > 0) {
          // Clear any existing routes first
          if (window.currentRoutePolyline) {
            window.currentRoutePolyline.setMap(null);
          }
          
          // Get path coordinates from the response
          const path = [];
          const route = result.routes[0];
          
          // Extract path points from each leg and step
          route.legs.forEach(leg => {
            leg.steps.forEach(step => {
              // Decode polyline points if available
              if (step.polyline && step.polyline.points) {
                const decodedPath = window.google.maps.geometry.encoding.decodePath(step.polyline.points);
                decodedPath.forEach(point => {
                  path.push(point);
                });
              } 
              // Fallback to using path points directly if available
              else if (step.path && step.path.length) {
                step.path.forEach(point => {
                  path.push(new window.google.maps.LatLng(
                    point.lat.constructor.name === "Function" ? point.lat() : point.lat,
                    point.lng.constructor.name === "Function" ? point.lng() : point.lng
                  ));
                });
              }
            });
          });
          
          // Create polyline with the path
          window.currentRoutePolyline = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#2E86C1', // Blue color
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: mapRef.current
          });
        }
      } else {
        clearRoute();
      }
    } catch (err) {
      console.error(err);
      clearRoute();
      alert('Error calculating route.');
    }
  };
  
  const tourStreet = () => {
    if (!optimizedRoute) {
      alert("No route available to tour");
      return;
    }
    
    setShowStreetView(true);
  };
  
  const handleStreetViewClose = (images, videoUrl) => {
    setShowStreetView(false);
    
    // Store all captured images from the tour
    if (images && images.length > 0) {
      setCapturedViews(prev => [...prev, ...images]);
    }
    
    // Set the video URL if available
    if (videoUrl) {
      setVideoUrl(videoUrl);
    }
    
    console.log(`Tour completed with ${images.length} images captured`);
  };
  
  const handleImageCapture = (image) => {
    // Do something immediately when an image is captured
    console.log("Image captured:", image);
  };

  const clearRoute = () => {
    markers.forEach(m => m.setMap(null));
    setMarkers([]);
    if (window.currentRoutePolyline) {
      window.currentRoutePolyline.setMap(null);
      window.currentRoutePolyline = null;
    }
    setOptimizedRoute(null);
  };

  return (
    <div>
      <div className="controls">
        <button onClick={startDrawingBoundary}>
          {boundary ? 'Redraw Boundary' : 'Draw Boundary'}
        </button>
        <button onClick={calculateRoute} disabled={markers.length < 2}>
          Calculate Route
        </button>
        <button onClick={tourStreet} disabled={!optimizedRoute}>
          Tour the street via Street View
        </button>
        <button onClick={clearRoute}>
          Clear Markers
        </button>
      </div>

      {showStreetView && (
        <div className="street-view-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          zIndex: 1000
        }}>
          <StreetViewTour 
            route={optimizedRoute}
            onClose={handleStreetViewClose}
            onCapture={handleImageCapture}
            transcodeImagesToVideo={transcodeImagesToVideo}
          />
        </div>
      )}

      {videoUrl && (
        <div className="video-container" style={{ margin: '20px 0' }}>
          <h3>Street View Video</h3>
          <video controls src={videoUrl} style={{ width: '100%', maxWidth: '800px' }} />
          <a
            href={videoUrl}
            download="streetview_video.mp4"
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            Download Video
          </a>
        </div>
      )}

      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={['drawing', 'places', 'geometry']}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={onLoad}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
          }}
        />
      </LoadScript>
    </div>
  );
};

export default MapComponent;
