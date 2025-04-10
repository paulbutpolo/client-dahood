import React, { useRef, useState, useEffect } from 'react';

const SimpleVideoPlayer = ({ videoUrl }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Reset error state when URL changes
    setError(null);
  }, [videoUrl]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    
    if (!video) return;
    
    if (video.paused) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          console.error('Play error:', e);
          setError('Playback failed. Try again.');
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoError = (e) => {
    console.error('Video error event:', e);
    setError('Failed to load video. Check the URL and try again.');
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      {error && (
        <div style={{ 
          color: 'red', 
          padding: '10px',
          backgroundColor: '#ffeeee',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          {error}
        </div>
      )}
      
      <video 
        ref={videoRef}
        src={videoUrl}
        crossOrigin="anonymous"
        controls
        style={{ width: '100%', height: 'auto', maxHeight: '500px' }}
        onError={handleVideoError}
      />
      
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
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

export default SimpleVideoPlayer;