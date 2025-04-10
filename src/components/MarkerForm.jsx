import React, { useState } from 'react';

function MarkerForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit({
      name,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      }
    });
    
    // Reset form
    setName('');
    setLat('');
    setLng('');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Marker Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Latitude:</label>
        <input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Longitude:</label>
        <input
          type="number"
          step="any"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          required
        />
      </div>
      <button type="submit">Create Marker</button>
    </form>
  );
}

export default MarkerForm;
