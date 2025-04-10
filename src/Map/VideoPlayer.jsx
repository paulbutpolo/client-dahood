import React, { useEffect, useRef, useState } from 'react';
import 'aframe'; // You'll need to install aframe via npm
import VideoService from '../services/VideoService';

const VideoPlayer = ({ videoUrl }) => {
  const videoRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedVideoDetails, setUploadedVideoDetails] = useState(null);
  const [videoTitle, setVideoTitle] = useState('360° Street View Tour');
  const [videoDescription, setVideoDescription] = useState('Generated 360° street view tour video');
  
  useEffect(() => {
    // Reference to the video element
    const video = document.getElementById('panoramaVideo');
    
    // Add event listeners for video controls
    document.getElementById('playButton')?.addEventListener('click', () => {
      video.play();
    });
    
    document.getElementById('pauseButton')?.addEventListener('click', () => {
      video.pause();
    });
    
    // Initialize A-Frame scene properly
    const scene = document.querySelector('a-scene');
    if (scene) {
      // Ensure proper 360° video rendering
      scene.addEventListener('loaded', () => {
        console.log('A-Frame scene loaded');
        // Additional setup can go here
      });
    }
    
    return () => {
      // Cleanup event listeners
      document.getElementById('playButton')?.removeEventListener('click', () => {});
      document.getElementById('pauseButton')?.removeEventListener('click', () => {});
    };
  }, [videoUrl]);

  const handleDownload = () => {
    // Create a proper download with 360 metadata
    const a = document.createElement('a');
    
    fetch(videoUrl)
      .then(response => response.blob())
      .then(blob => {
        // Here you might use a library like mp4box.js to inject metadata
        // For now, we're using the metadata from FFmpeg
        const enhancedBlob = new Blob([blob], { type: 'video/mp4' });
        const downloadUrl = URL.createObjectURL(enhancedBlob);
        
        a.href = downloadUrl;
        a.download = "360_streetview_video.mp4";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      });
  };

  const handleUpload = async () => {
    if (!videoUrl) {
      alert('No video available to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Fetch the video blob from the URL
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      // Prepare metadata for upload
      const metadata = {
        title: videoTitle,
        description: videoDescription,
        panoramas: [], // Add any panorama data if available
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      };
      
      // Upload using enhanced VideoService with chunking
      const result = await VideoService.uploadVideo(blob, metadata);
      
      // Set progress to 100% when complete
      setUploadProgress(100);
      setUploadComplete(true);
      setUploadedVideoDetails(result);
      
      // Show success message
      setTimeout(() => {
        alert('Video uploaded successfully!');
      }, 500);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Failed to upload video: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyShareLink = () => {
    if (!uploadedVideoDetails || !uploadedVideoDetails.shareableId) return;
    
    const shareUrl = `${window.location.origin}/videos/share/${uploadedVideoDetails.shareableId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => alert('Share link copied to clipboard'))
      .catch(err => console.error('Failed to copy link:', err));
  };

  return (
    <div className="panorama-video-container" style={{ margin: '20px 0' }}>
      <h3>360° Street View Video</h3>
      <p>Look around by dragging or using your device's gyroscope!</p>
      
      <div style={{ height: '500px', width: '100%', maxWidth: '800px', position: 'relative' }}>
        <a-scene embedded style={{ height: '100%', width: '100%' }}>
          <a-assets>
            <video 
              id="panoramaVideo" 
              ref={videoRef}
              src={videoUrl} 
              crossOrigin="anonymous"
              preload="auto"
              loop
              playsInline="true"
              webkit-playsinline="true"
            ></video>
          </a-assets>
          
          {/* The key part - equirectangular projection for 360° video */}
          <a-videosphere 
            src="#panoramaVideo" 
            rotation="0 -90 0"
            segments-height="64"
            segments-width="64"
          ></a-videosphere>
          
          <a-camera>
            <a-cursor color="white"></a-cursor>
          </a-camera>
        </a-scene>
      </div>
      
      {/* Video Controls */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button 
          id="playButton" 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Play
        </button>
        <button 
          id="pauseButton" 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#f44336', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Pause
        </button>
        <button 
          onClick={handleDownload}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Download 360° Video
        </button>
      </div>
      
      {/* Upload Section with API Integration */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h4>Share Your 360° Video</h4>
        
        {!uploadComplete ? (
          <>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label htmlFor="videoTitle" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Video Title:
                </label>
                <input
                  id="videoTitle"
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  disabled={isUploading}
                />
              </div>
              
              <div>
                <label htmlFor="videoDescription" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Description:
                </label>
                <textarea
                  id="videoDescription"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    minHeight: '80px'
                  }}
                  disabled={isUploading}
                />
              </div>
            </div>
            
            {isUploading ? (
              <div>
                <p>Uploading video... {uploadProgress}%</p>
                <div style={{ 
                  height: '10px', 
                  backgroundColor: '#ddd', 
                  borderRadius: '5px', 
                  margin: '10px 0' 
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${uploadProgress}%`, 
                    backgroundColor: '#4CAF50', 
                    borderRadius: '5px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleUpload}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Upload Video
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ 
            backgroundColor: '#e8f5e9', 
            padding: '15px', 
            borderRadius: '5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '18px' }}>✓ Upload Complete!</span>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <p><strong>Title:</strong> {uploadedVideoDetails?.title || videoTitle}</p>
              <p><strong>Video ID:</strong> {uploadedVideoDetails?.id || 'N/A'}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopyShareLink}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Copy Share Link
              </button>
              
              <button
                onClick={() => {
                  setUploadComplete(false);
                  setUploadedVideoDetails(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Upload Another Version
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;