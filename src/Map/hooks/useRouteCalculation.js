import { useState } from 'react';

const API = 'http://localhost:5000/api';

export const useRouteCalculation = (mapRef, markers) => {
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  const selectMarkerAsStart = (markerId) => {
    setStartPoint(markerId);
    // Clear end point if it's the same as new start point
    if (endPoint === markerId) {
      setEndPoint(null);
    }
  };

  const selectMarkerAsEnd = (markerId) => {
    setEndPoint(markerId);
    // Clear start point if it's the same as new end point
    if (startPoint === markerId) {
      setStartPoint(null);
    }
  };

  const calculateRoute = async () => {
    if (!startPoint || !endPoint) {
      alert("Please select both start and end points");
      return;
    }

    try {
      // Find the marker objects that correspond to our start and end points
      const startMarker = markers.find(m => m.id === startPoint);
      const endMarker = markers.find(m => m.id === endPoint);
      
      if (!startMarker || !endMarker) {
        alert("Selected markers not found");
        return;
      }

      const origin = {
        lat: startMarker.getPosition().lat(),
        lng: startMarker.getPosition().lng()
      };

      const destination = {
        lat: endMarker.getPosition().lat(),
        lng: endMarker.getPosition().lng()
      };

      // Get all markers that are not start or end as waypoints
      const waypointMarkers = markers.filter(m => 
        m.id !== startPoint && m.id !== endPoint
      );

      const waypoints = waypointMarkers.map(marker => ({
        lat: marker.getPosition().lat(),
        lng: marker.getPosition().lng()
      }));

      const response = await fetch(`${API}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, waypoints: [] })
      });
      
      const result = await response.json();

      if (result.status === "OK") {
        setOptimizedRoute(result);
        
        if (result.routes && result.routes.length > 0) {
          if (window.currentRoutePolyline) {
            window.currentRoutePolyline.setMap(null);
          }
          
          const path = [];
          const route = result.routes[0];
          
          route.legs.forEach(leg => {
            leg.steps.forEach(step => {
              if (step.polyline && step.polyline.points) {
                const decodedPath = window.google.maps.geometry.encoding.decodePath(step.polyline.points);
                path.push(...decodedPath);
              } else if (step.path && step.path.length) {
                step.path.forEach(point => {
                  path.push(new window.google.maps.LatLng(
                    point.lat.constructor.name === "Function" ? point.lat() : point.lat,
                    point.lng.constructor.name === "Function" ? point.lng() : point.lng
                  ));
                });
              }
            });
          });
          
          window.currentRoutePolyline = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#2E86C1',
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: mapRef.current
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error calculating route.');
    }
  };

  const clearRoute = () => {
    if (window.currentRoutePolyline) {
      window.currentRoutePolyline.setMap(null);
      window.currentRoutePolyline = null;
    }
    setOptimizedRoute(null);
    setStartPoint(null);
    setEndPoint(null);
  };

  return { 
    optimizedRoute, 
    calculateRoute, 
    clearRoute,
    startPoint,
    endPoint,
    selectMarkerAsStart,
    selectMarkerAsEnd
  };
};