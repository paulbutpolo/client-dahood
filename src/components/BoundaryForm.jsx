import React, { useState } from 'react';

function BoundaryForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [coordinates, setCoordinates] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Parse the coordinates from the textarea
    // Format expected: lat1,lng1;lat2,lng2;lat3,lng3
    const parsedCoordinates = coordinates.split(';').map(pair => {
      const [lat, lng] = pair.split(',').map(coord => parseFloat(coord.trim()));
      return { lat, lng };
    });
    
    onSubmit({
      name,
      coordinates: parsedCoordinates
    });
    
    // Reset form
    setName('');
    setCoordinates('');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Boundary Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Coordinates (lat,lng;lat,lng):</label>
        <textarea
          value={coordinates}
          onChange={(e) => setCoordinates(e.target.value)}
          placeholder="37.7749,-122.4194;37.7749,-122.4094;37.7849,-122.4094;37.7849,-122.4194"
          required
        />
      </div>
      <button type="submit">Create Boundary</button>
    </form>
  );
}

export default BoundaryForm;