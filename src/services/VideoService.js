// services/VideoService.js
import makeApiCall from '../api/Api';

export default class VideoService {
  // Upload a new 360° video
  static async uploadVideo(videoBlob, metadata) {
    try {
      // Convert video blob to base64
      const base64Video = await this.blobToBase64(videoBlob);
      
      // Prepare data for upload
      const uploadData = {
        videoData: base64Video,
        title: metadata.title || '360° Street View Tour',
        description: metadata.description || 'Generated from Street View',
        panoramas: metadata.panoramas || []
      };
      
      // Make API call to upload video
      // Add a leading '/' if your base URL doesn't include it
      const response = await makeApiCall('/videos/upload', 'post', uploadData);
      return response;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  // Convert blob to base64
  static blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extract base64 data from reader result
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get all videos for the current user
  static async getUserVideos() {
    try {
      const response = await makeApiCall('/videos/my-videos', 'get');
      return response;
    } catch (error) {
      console.error('Error getting user videos:', error);
      throw error;
    }
  }

  // Get video metadata by shareable ID
  static async getVideoMetadata(shareableId) {
    try {
      const response = await makeApiCall(`/videos/share/${shareableId}/metadata`, 'get');
      return response;
    } catch (error) {
      console.error('Error getting video metadata:', error);
      throw error;
    }
  }

  // Get stream URL for a video
  static getStreamUrl(shareableId) {
    return `${import.meta.env.VITE_API_URL}videos/share/${shareableId}/stream`;
  }

  // Get download URL for a video
  static getDownloadUrl(shareableId) {
    return `${import.meta.env.VITE_API_URL}videos/share/${shareableId}/download`;
  }

  // Update video metadata
  static async updateVideo(videoId, updateData) {
    try {
      const response = await makeApiCall(`/videos/${videoId}`, 'put', updateData);
      return response;
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }

  // Delete a video
  static async deleteVideo(videoId) {
    try {
      const response = await makeApiCall(`/videos/${videoId}`, 'delete');
      return response;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }
}