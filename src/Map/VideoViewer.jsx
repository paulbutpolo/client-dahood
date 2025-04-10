// import React, { useState, useEffect } from 'react';
// import SimpleVideoPlayer from './SimpleVideoPlayer'; // Import the new player
// import { useParams } from 'react-router-dom';
// import VideoService from '../services/VideoService';

// const VideoViewer = () => {
//   const { shareableId } = useParams();
//   const [videoData, setVideoData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [streamUrl, setStreamUrl] = useState('');

//   useEffect(() => {
//     const fetchVideoData = async () => {
//       try {
//         setLoading(true);
//         const response = await VideoService.getVideoMetadata(shareableId);
//         setVideoData(response.video);
        
//         // Get and store the stream URL
//         const url = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/videos/share/${shareableId}/stream`;
//         console.log('Stream URL:', url); // Debug log
//         setStreamUrl(url);
//       } catch (err) {
//         console.error('Error fetching video:', err);
//         setError(err.message || 'Failed to load video');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchVideoData();
//   }, [shareableId]);

//   if (loading) return <div>Loading video data...</div>;
//   if (error) return <div>Error: {error}</div>;
//   if (!videoData) return <div>Video not found</div>;

//   const downloadUrl = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/videos/share/${shareableId}/download`;

//   return (
//     <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
//       <h2>{videoData.title}</h2>
//       <p>{videoData.description}</p>
      
//       <div style={{ margin: '20px 0' }}>
//         <SimpleVideoPlayer videoUrl={streamUrl} />
//       </div>
      
//       <div style={{ marginTop: '20px' }}>
//         <a 
//           href={downloadUrl} 
//           download="street_view_video.mp4"
//           style={{
//             padding: '10px 15px',
//             background: '#4285f4',
//             color: 'white',
//             borderRadius: '4px',
//             textDecoration: 'none'
//           }}
//         >
//           Download Original
//         </a>
//       </div>
//     </div>
//   );
// };

// export default VideoViewer;

import React, { useState, useEffect } from 'react';
import Enhanced360Player from './VideoPlayerShare';
import { useParams } from 'react-router-dom';
import VideoService from '../services/VideoService';

const VideoViewer = () => {
  const { shareableId } = useParams();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamUrl, setStreamUrl] = useState('');

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        const response = await VideoService.getVideoMetadata(shareableId);
        setVideoData(response.video);
        
        // Get and store the stream URL directly
        const url = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/videos/share/${shareableId}/stream`;
        console.log('Stream URL:', url); // Debug log
        setStreamUrl(url);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [shareableId]);

  if (loading) return <div>Loading video data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!videoData) return <div>Video not found</div>;

  const downloadUrl = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/videos/share/${shareableId}/download`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>{videoData.title}</h2>
      <p>{videoData.description}</p>
      
      <div style={{ margin: '20px 0' }}>
        <Enhanced360Player videoUrl={streamUrl} />
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <a 
          href={downloadUrl} 
          download="360_video.mp4"
          style={{
            padding: '10px 15px',
            background: '#4285f4',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none'
          }}
        >
          Download Original
        </a>
      </div>
    </div>
  );
};

export default VideoViewer;