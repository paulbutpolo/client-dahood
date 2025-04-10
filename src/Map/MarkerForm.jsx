// components/MarkerForm.jsx
import React, { useState } from 'react';

const MarkerForm = ({ 
  position, 
  boundaryId,
  onSave, 
  onCancel 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      description,
      position: {
        lat: position.lat(),
        lng: position.lng()
      },
      boundary: boundaryId
    });
  };

  return (
    <div className="marker-form">
      <h3>Add Marker</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
        </div>
        <div>
          <button type="submit">Save</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default MarkerForm;