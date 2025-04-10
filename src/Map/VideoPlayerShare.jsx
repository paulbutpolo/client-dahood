import React, { useEffect, useRef, useState } from 'react';
import 'aframe';

const Enhanced360Player = ({ videoUrl }) => {
  const videoRef = useRef(null);
  const sceneRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  // Create unique ID for the video element
  const videoId = useRef(`video-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Reset states when URL changes
    setIsLoaded(false);
    setIsPlaying(false);
    setError(null);
  }, [videoUrl]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Play error:', err);
          setError('Playback requires user interaction');
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative' }}>
      {/* A-Frame Scene */}
      <a-scene 
        ref={sceneRef}
        embedded
        vr-mode-ui="enabled: true"
        style={{ width: '100%', height: '100%' }}
      >
        <a-assets>
          <video 
            id={videoId.current}
            ref={videoRef}
            src={videoUrl}
            crossOrigin="anonymous"
            loop
            preload="auto"
            playsInline
            onError={(e) => {
              console.error('Video error:', e);
              setError('Failed to load video');
            }}
            onLoadedMetadata={() => {
              console.log('Video metadata loaded');
              setIsLoaded(true);
            }}
          ></video>
        </a-assets>
        
        {/* 360° Video Sphere */}
        {isLoaded && (
          <a-videosphere 
            src={`#${videoId.current}`} 
            rotation="0 -90 0"
          ></a-videosphere>
        )}
        
        {/* Camera with mouse/touch controls */}
        <a-camera look-controls="reverseMouseDrag: true">
          <a-cursor color="white"></a-cursor>
        </a-camera>
        
        {/* Loading text - only shown before video is loaded */}
        {!isLoaded && !error && (
          <a-entity position="0 0 -3">
            <a-text 
              value="Loading 360° video..." 
              align="center"
              color="white"
              width="5"
            ></a-text>
          </a-entity>
        )}
        
        {/* Error text - only shown if there's an error */}
        {error && (
          <a-entity position="0 0 -3">
            <a-text 
              value={`Error: ${error}`}
              align="center"
              color="red"
              width="5"
            ></a-text>
          </a-entity>
        )}
      </a-scene>
      
      {/* Controls overlay */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={handlePlayPause}
          style={{
            padding: '8px 15px',
            backgroundColor: isPlaying ? '#555' : '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        {error && (
          <button
            onClick={() => setError(null)}
            style={{
              padding: '8px 15px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default Enhanced360Player;