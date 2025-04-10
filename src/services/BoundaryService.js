// services/BoundaryService.js
import makeApiCall from '../api/Api';

class BoundaryService {
  static async createBoundary(boundaryData) {
    return makeApiCall('/api/boundaries', 'post', boundaryData);
  }

  static async getBoundaries() {
    return makeApiCall('/api/boundaries');
  }

  static async getBoundary(id) {
    return makeApiCall(`/api/boundaries/${id}`);
  }

  static async updateBoundary(id, boundaryData) {
    return makeApiCall(`/api/boundaries/${id}`, 'put', boundaryData);
  }

  static async deleteBoundary(id) {
    return makeApiCall(`/api/boundaries/${id}`, 'delete');
  }
}

export default BoundaryService;