// components/BoundaryList.jsx
import React, { useState, useEffect } from 'react';
import BoundaryService from '../services/BoundaryService';
import './css/BoundaryList.css'

const BoundaryList = ({ onBoundarySelect, currentBoundaryId }) => {
  const [boundaries, setBoundaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBoundaries = async () => {
      try {
        setIsLoading(true);
        const response = await BoundaryService.getBoundaries();
        setBoundaries(response.data || []);
        setError('');
      } catch (err) {
        console.error('Error fetching boundaries:', err);
        setError('Failed to load boundaries. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoundaries();
  }, []);

  const handleBoundaryClick = (boundary) => {
    onBoundarySelect(boundary);
  };

  const handleDelete = async (e, boundaryId) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    
    if (!window.confirm('Are you sure you want to delete this boundary?')) {
      return;
    }
    
    try {
      await BoundaryService.deleteBoundary(boundaryId);
      // Remove from the local state
      setBoundaries(boundaries.filter(b => b._id !== boundaryId));
    } catch (err) {
      console.error('Error deleting boundary:', err);
      alert('Failed to delete boundary. Please try again.');
    }
  };

  if (isLoading) return <div className="boundary-list loading">Loading boundaries...</div>;

  return (
    <div className="boundary-list">
      <h3>Saved Boundaries</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      {boundaries.length === 0 ? (
        <p className="no-boundaries">No boundaries saved yet. Draw a boundary to get started.</p>
      ) : (
        <ul>
          {boundaries.map(boundary => (
            <li 
              key={boundary._id} 
              className={boundary._id === currentBoundaryId ? 'selected' : ''}
              onClick={() => handleBoundaryClick(boundary)}
            >
              <div className="boundary-item">
                <div className="boundary-info">
                  <h4>{boundary.name}</h4>
                  {boundary.description && <p>{boundary.description}</p>}
                  <small>Created: {new Date(boundary.createdAt).toLocaleDateString()}</small>
                </div>
                <div className="boundary-actions">
                  <button 
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, boundary._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BoundaryList;