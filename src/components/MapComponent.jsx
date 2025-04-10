import React, { useRef, useEffect } from 'react';

function MapComponent({ boundaries, markers, routes, selectedBoundary, onBoundarySelect }) {
  const canvasRef = useRef(null);
  
  // Simple 2D map rendering using canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up coordinate transformation (very simple, would need proper scaling in real app)
    const transformCoords = (lat, lng) => {
      // This is a very simplified transformation for demonstration
      // In a real app, you would use proper map projection
      return {
        x: (lng + 180) * (canvas.width / 360),
        y: (90 - lat) * (canvas.height / 180)
      };
    };
    
    // Draw boundaries
    boundaries.forEach(boundary => {
      ctx.beginPath();
      const isSelected = boundary._id === selectedBoundary;
      
      boundary.coordinates.forEach((coord, index) => {
        const point = transformCoords(coord.lat, coord.lng);
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.closePath();
      ctx.strokeStyle = isSelected ? 'blue' : 'black';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();
      
      // Add fill with transparency
      ctx.fillStyle = isSelected ? 'rgba(0, 0, 255, 0.1)' : 'rgba(200, 200, 200, 0.1)';
      ctx.fill();
      
      // Add boundary name
      if (boundary.coordinates.length > 0) {
        const centerPoint = transformCoords(
          boundary.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / boundary.coordinates.length,
          boundary.coordinates.reduce((sum, coord) => sum + coord.lng, 0) / boundary.coordinates.length
        );
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.fillText(boundary.name, centerPoint.x, centerPoint.y);
      }
    });
    
    // Draw markers
    markers.forEach(marker => {
      const point = transformCoords(marker.location.lat, marker.location.lng);
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = marker.boundaryId === selectedBoundary ? 'red' : 'gray';
      ctx.fill();
      
      // Add marker name
      ctx.fillStyle = 'black';
      ctx.font = '10px Arial';
      ctx.fillText(marker.name, point.x + 8, point.y);
    });
    
    // Draw routes
    routes.forEach(route => {
      if (route.boundaryId === selectedBoundary) {
        ctx.beginPath();
        route.points.forEach((point, index) => {
          const coords = transformCoords(point.lat, point.lng);
          if (index === 0) {
            ctx.moveTo(coords.x, coords.y);
          } else {
            ctx.lineTo(coords.x, coords.y);
          }
        });
        
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [boundaries, markers, routes, selectedBoundary]);
  
  const handleCanvasClick = (e) => {
    // Handle boundary selection
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Simplified point-in-polygon check for boundary selection
    boundaries.forEach(boundary => {
      // This would be better with a proper point-in-polygon algorithm
      // But for simplicity, we're just checking if the point is near a boundary
      let isInside = false;
      const transformCoords = (lat, lng) => {
        return {
          x: (lng + 180) * (canvas.width / 360),
          y: (90 - lat) * (canvas.height / 180)
        };
      };
      
      // Simple check by creating a path and using isPointInPath
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      boundary.coordinates.forEach((coord, index) => {
        const point = transformCoords(coord.lat, coord.lng);
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      
      if (ctx.isPointInPath(x, y)) {
        isInside = true;
      }
      
      if (isInside) {
        onBoundarySelect(boundary._id);
      }
    });
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={400} 
      onClick={handleCanvasClick}
      style={{ border: '1px solid black' }}
    />
  );
}

export default MapComponent;