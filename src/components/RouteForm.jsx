import React, { useState } from 'react';

function RouteForm({ markers, onSubmit }) {
  const [name, setName] = useState('');
  const [startMarkerId, setStartMarkerId] = useState('');
  const [endMarkerId, setEndMarkerId] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit({
      name,
      startMarkerId,
      endMarkerId
    });
    
    // Reset form
    setName('');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Route Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Start Point:</label>
        <select
          value={startMarkerId}
          onChange={(e) => setStartMarkerId(e.target.value)}
          required
        >
          <option value="">Select start marker</option>
          {markers.map(marker => (
            <option key={marker._id} value={marker._id}>
              {marker.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>End Point:</label>
        <select
          value={endMarkerId}
          onChange={(e) => setEndMarkerId(e.target.value)}
          required
        >
          <option value="">Select end marker</option>
          {markers.map(marker => (
            <option key={marker._id} value={marker._id}>
              {marker.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">Calculate Route</button>
    </form>
  );
}

export default RouteForm;