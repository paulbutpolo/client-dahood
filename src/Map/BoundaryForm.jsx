// components/BoundaryForm.jsx
import React, { useState } from 'react';
import BoundaryService from '../services/BoundaryService';

const BoundaryForm = ({ boundaryPaths, onSaveComplete, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (!name.trim()) {
        throw new Error('Boundary name is required');
      }
      
      const response = await BoundaryService.createBoundary({
        name,
        description,
        paths: boundaryPaths
      });
      
      setIsSubmitting(false);
      onSaveComplete(response.data);
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to save boundary');
    }
  };

  return (
    <div className="boundary-form-overlay">
      <div className="boundary-form">
        <h3>Save Boundary</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Boundary Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description (optional):</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Boundary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoundaryForm;