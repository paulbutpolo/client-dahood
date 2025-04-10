// services/MarkerService.js
import makeApiCall from '../api/Api';

class MarkerService {
  static async createMarker(markerData) {
    return makeApiCall('/api/markers', 'post', markerData);
  }

  static async getMarkers(boundaryId) {
    return makeApiCall(`/api/markers/boundary/${boundaryId}`);
  }

  static async getMarker(id) {
    return makeApiCall(`/api/markers/${id}`);
  }

  static async updateMarker(id, markerData) {
    return makeApiCall(`/api/markers/${id}`, 'put', markerData);
  }

  static async deleteMarker(id) {
    return makeApiCall(`/api/markers/${id}`, 'delete');
  }
}

export default MarkerService;