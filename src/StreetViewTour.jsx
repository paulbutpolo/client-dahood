// StreetViewTour.jsx
import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, StreetViewPanorama } from '@react-google-maps/api';

const StreetViewTour = ({ route, onClose, onCapture, transcodeImagesToVideo }) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [capturedImageUrls, setCapturedImageUrls] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [isTourInitialized, setIsTourInitialized] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const streetViewRef = useRef(null);
  const intervalRef = useRef(null);

  // Extract all points from the optimized route
  const getAllRoutePoints = () => {
    if (!route || !route.routes || route.routes.length === 0) return [];
    
    const points = [];
    const routeObj = route.routes[0];
    
    routeObj.legs.forEach(leg => {
      leg.steps.forEach(step => {
        if (step.polyline && step.polyline.points) {
          const decodedPath = window.google.maps.geometry.encoding.decodePath(step.polyline.points);
          points.push(...decodedPath);
        } else if (step.path && step.path.length) {
          step.path.forEach(point => {
            points.push(new window.google.maps.LatLng(
              point.lat.constructor.name === "Function" ? point.lat() : point.lat,
              point.lng.constructor.name === "Function" ? point.lng() : point.lng
            ));
          });
        }
      });
    });
    
    return points;
  };

  const routePoints = getAllRoutePoints();

  const startTour = () => {
    if (routePoints.length > 0) {
      setCurrentPosition(routePoints[0]);
      setCurrentIndex(0);
      setIsTourInitialized(true);
      setIsPlaying(true);
    }
  };

  const handleNextPoint = () => {
    if (currentIndex < routePoints.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentPosition(routePoints[nextIndex]);
      setProgress(((nextIndex + 1) / routePoints.length) * 100);
    } else {
      setIsPlaying(false);
    }
  };

  const captureStitchedPanorama = async () => {
    if (!streetViewRef.current) return;
    
    const panorama = streetViewRef.current;
    const position = panorama.getPosition();
    const panoId = panorama.getPano();
  
    const { stitchedUrl } = await fetchStitchedPanorama(position, panoId);
    
    const imageData = {
      position: position,
      panoId: panoId,
      imageUrl: stitchedUrl,
      timestamp: new Date().toISOString(),
      isPanorama: true
    };
    
    setCapturedImageUrls(prev => [...prev, imageData]);
    if (onCapture) onCapture(imageData);
  };

  const fetchStitchedPanorama = async (position, panoId) => {
    const headings = [0, 90, 180, 270]; // 4 cardinal directions
    const fov = 90;                     // 90° field of view for each image
    const imageWidth = 2048;
    const imageHeight = 2048;
  
    // Create a canvas with proper equirectangular ratio (2:1)
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = imageWidth * headings.length;  // 8192
    finalCanvas.height = finalCanvas.width / 2;        // 4096 (2:1 ratio)
    const ctx = finalCanvas.getContext('2d');
  
    // Load and stitch the 4 directional images
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const url = `https://maps.googleapis.com/maps/api/streetview?size=${imageWidth}x${imageHeight}&pano=${panoId}&heading=${heading}&pitch=0&fov=${fov}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
  
      const image = new Image();
      image.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        image.onload = () => {
          // Calculate position to maintain proper equirectangular mapping
          const x = i * imageWidth;
          // We're drawing square images into a rectangular canvas, so center vertically
          const y = (finalCanvas.height - imageHeight) / 2;
          ctx.drawImage(image, x, y, imageWidth, imageHeight);
          resolve();
        };
        image.onerror = reject;
        image.src = url;
      });
    }
  
    // Add XMP metadata for 360° recognition
    return new Promise((resolve) => {
      finalCanvas.toBlob(blob => {
        // We need to save the blob with proper 360° metadata
        // This is a simple object URL for now
        const stitchedUrl = URL.createObjectURL(blob);
        
        // In a full implementation, you'd use something like exiftool.js
        // to add the proper XMP metadata to the JPEG
        
        resolve({ 
          stitchedUrl, 
          blob,
          metadata: {
            spherical: true,
            stereo: "monoscopic",
            projection: "equirectangular" 
          }
        });
      }, 'image/jpeg', 0.95);
    });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(handleNextPoint, 3000);
    }
  };

  const handleGenerateVideo = async () => {
    if (capturedImageUrls.length === 0) {
      alert("No images captured to generate video");
      return;
    }

    setIsProcessingVideo(true);
    
    try {
      // Extract just the URLs for the video transcoding
      const imageUrls = capturedImageUrls.map(img => img.imageUrl);
      
      // Call the transcode function with the image URLs
      const videoUrl = await transcodeImagesToVideo(imageUrls);
      
      // Save the video URL in state but don't close the tour
      setGeneratedVideoUrl(videoUrl);
      
      // Notify parent component about the video without closing the tour
      if (onCapture) onCapture({videoUrl});
      
      // Pass the video URL to parent without closing
      if (onClose) {
        // Pass only the videoUrl as second parameter so parent can display it
        // but don't close the component
        onClose(null, videoUrl, false);
      }
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Error generating video. Please try again.');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const handleExitTour = () => {
    clearInterval(intervalRef.current);
    // Explicitly pass true for the close parameter
    if (onClose) onClose(capturedImageUrls, generatedVideoUrl, true);
  };

  // Initialize tour on mount
  useEffect(() => {
    startTour();
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying && isTourInitialized) {
      intervalRef.current = setInterval(handleNextPoint, 1500);
      return () => clearInterval(intervalRef.current);
    }
  }, [isPlaying, currentIndex, isTourInitialized]);

  useEffect(() => {
    if (currentPosition && isTourInitialized && isPlaying) {
      captureStitchedPanorama();
    }
  }, [currentPosition, isTourInitialized, isPlaying]);

  if (!currentPosition) {
    return <div>Loading street view...</div>;
  }

  return (
    <div className="street-view-container" style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1, backgroundColor: 'white', padding: '10px', borderRadius: '5px' }}>
        <h3>Street View Tour</h3>
        <p>Point {currentIndex + 1} of {routePoints.length}</p>
        
        <div style={{ width: '300px', height: '10px', backgroundColor: '#ddd', margin: '10px 0' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#4CAF50' }}></div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', margin: '10px 0', flexWrap: 'wrap' }}>
          <button onClick={handlePlayPause}>
            {isPlaying ? 'Pause Tour' : 'Resume Tour'}
          </button>
          <button 
            onClick={handleGenerateVideo} 
            disabled={capturedImageUrls.length === 0 || isProcessingVideo}
          >
            {isProcessingVideo ? 'Generating Video...' : 'Generate Video'}
          </button>
          {generatedVideoUrl && (
            <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
              Video Generated! You can continue the tour or exit to view it.
            </div>
          )}
          <button 
            onClick={handleExitTour}
            style={{ 
              backgroundColor: generatedVideoUrl ? '#4CAF50' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            {generatedVideoUrl ? 'Exit Tour & View Video' : 'Exit Tour'}
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: '100%' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={currentPosition}
          zoom={14}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          <StreetViewPanorama
            position={currentPosition}
            visible={true}
            options={{
              position: currentPosition,
              pov: { heading: 0, pitch: 0 },
              zoom: 1,
              disableDefaultUI: true,
              showRoadLabels: true
            }}
            onLoad={panorama => {
              streetViewRef.current = panorama;
            }}
          />
        </GoogleMap>
      </div>

      {capturedImageUrls.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 1,
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '5px',
          maxWidth: '80%',
          overflowX: 'auto'
        }}>
          <h4>Captured Images ({capturedImageUrls.length})</h4>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {capturedImageUrls.map((img, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px',
                  textAlign: 'center'
                }}>
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreetViewTour;