import { useState, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ 
  log: true,
  corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
  workerPath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.10.0/dist/ffmpeg-core.worker.js',
  workerOptions: {
    workerResources: {
      memory: { initial: 500 * 1024 * 1024, maximum: 1000 * 1024 * 1024 }
    }
  }
});

export const useFfmpeg = () => {
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  useEffect(() => {
    const loadFfmpeg = async () => {
      await ffmpeg.load();
      setFfmpegLoaded(true);
    };
    loadFfmpeg();
  }, []);

  const transcodeImagesToVideo = async (images) => {
    await cleanupFFmpegFiles();
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    
    try {
      const frameDuplication = 10; // Each panorama gets repeated frames for smoother transitions
      
      // Track progress for UI feedback
      const totalFrames = images.length * frameDuplication;
      let processedFrames = 0;
      
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) continue;
          
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Add each image multiple times for smoother transition
          for (let j = 0; j < frameDuplication; j++) {
            const frameIndex = (i * frameDuplication) + j;
            ffmpeg.FS('writeFile', `frame_${frameIndex.toString().padStart(5, '0')}.jpg`, uint8Array);
            processedFrames++;
          }
        } catch (error) {
          console.error(`Error processing image ${i}:`, error);
        }
      }
  
      // Use FFmpeg's concat filter for frame-accurate transitions
      await ffmpeg.run(
        // Input configuration
        '-framerate', '30',
        '-i', 'frame_%05d.jpg',
        
        // Video processing
        // '-vf', 'scale=4096:2048:flags=lanczos,setsar=1:1,format=yuv420p',
        '-vf', 'scale=2048:1024,setsar=1:1,format=yuv420p',
        
        // Encoding settings
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-profile:v', 'high',
        '-tune', 'stillimage',
        
        // 360° metadata (multiple formats for compatibility)
        '-movflags', '+faststart',
        '-metadata:s:v:0', 'spherical=true',
        '-metadata:s:v:0', 'stereo_mode=mono',
        '-metadata:s:v:0', 'projection=equirectangular',
        
        // Google-specific XMP metadata (for YouTube)
        '-metadata', 'XMP-GPano:Spherical=True',
        '-metadata', 'XMP-GPano:ProjectionType=equirectangular',
        '-metadata', 'XMP-GPano:Stitched=True',
        
        // Spatial media metadata
        '-metadata', 'GSpherical:Spherical=true',
        '-metadata', 'GSpherical:Stitched=true',
        '-metadata', 'GSpherical:ProjectionType=equirectangular',
        
        'output.mp4'
      );
  
      const data = ffmpeg.FS('readFile', 'output.mp4');
      return URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    } catch (error) {
      console.error('Error during transcoding:', error);
      throw error;
    }
  };

  const cleanupFFmpegFiles = async () => {
    try {
      const files = ffmpeg.FS('readdir', '/');
      for (const file of files) {
        if (file !== '.' && file !== '..') {
          ffmpeg.FS('unlink', file);
        }
      }
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  };

  return { ffmpegLoaded, transcodeImagesToVideo };
};