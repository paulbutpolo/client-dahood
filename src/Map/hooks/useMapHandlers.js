import { useState, useCallback, useEffect } from 'react';
import BoundaryService from '../../services/BoundaryService';
import MarkerService from '../../services/MarkerService';

export const useMapHandlers = (
  mapRef, 
  boundary, 
  markers, 
  setMarkers, 
  setBoundary,
  selectMarkerAsStart,
  selectMarkerAsEnd
) => {
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const [drawingManager, setDrawingManager] = useState(null);
  const [showBoundaryForm, setShowBoundaryForm] = useState(false);
  const [currentBoundaryPaths, setCurrentBoundaryPaths] = useState(null);
  const [boundaryId, setBoundaryId] = useState(null);
  const [selectedBoundary, setSelectedBoundary] = useState(null);
  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [currentMarkerPosition, setCurrentMarkerPosition] = useState(null);
  const [savedMarkers, setSavedMarkers] = useState([]);
  const [markerMode, setMarkerMode] = useState(null); // 'start', 'end', or null

  useEffect(() => {
    console.log("markerMode changed to:", markerMode);
  }, [markerMode]);

  const isMarkerInPolygon = useCallback((marker, polygon) => {
    const markerPosition = marker.getPosition();
    return window.google.maps.geometry.poly.containsLocation(markerPosition, polygon);
  }, []);

  const isPointInPolygon = useCallback((latLng, polygon) => {
    console.log("Checking if point is in polygon:", latLng.lat(), latLng.lng());
    const result = window.google.maps.geometry.poly.containsLocation(latLng, polygon);
    console.log("Result:", result);
    return result;
  }, []);

  // Setup map click listener  
  const setupMapClickListener = useCallback(() => {
    console.log("Setting up map click listener");
    
    if (!mapRef.current) {
      console.log("Map reference not available");
      return;
    }
    
    // First, clear any existing click listeners to avoid duplicates
    window.google.maps.event.clearListeners(mapRef.current, 'click');
    
    // Then add a fresh click listener
    mapRef.current.addListener('click', (e) => {
      console.log("Map clicked at:", e.latLng.lat(), e.latLng.lng());
      console.log("isDrawingBoundary:", isDrawingBoundary);
      
      if (!isDrawingBoundary) {
        console.log("Not in drawing mode, attempting to add marker");
        // Use the location to create a marker
        const location = e.latLng;
        
        // Check if marker already exists at this location
        const existingMarker = markers.find(m => {
          const pos = m.getPosition();
          return pos.lat() === location.lat() && pos.lng() === location.lng();
        });
      
        if (existingMarker) {
          console.log("Existing marker found, not adding new one");
          return;
        }
      
        // Check if location is within boundary if one exists
        if (boundary) {
          console.log("Boundary exists, checking if point is within it");
          if (!isPointInPolygon(location, boundary)) {
            console.log("Point is outside boundary, not adding marker");
            alert("Marker must be placed within the boundary");
            return;
          }
        }

        setCurrentMarkerPosition(location);
        setShowMarkerForm(true);
      } else {
        console.log("In drawing mode, not adding marker");
      }
    });
    
    console.log("Map click listener setup complete");
  }, [mapRef, isDrawingBoundary, markers, boundary, isPointInPolygon]);

  const handleMarkerSaved = useCallback(async (markerData) => {
    try {
      const response = await MarkerService.createMarker(markerData);
      const savedMarker = response.data;
      
      // Create the marker on the map with a unique ID
      const markerId = `marker-${savedMarker._id || Date.now()}`;
      const marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(
          savedMarker.position.lat,
          savedMarker.position.lng
        ),
        map: mapRef.current,
        draggable: true,
        id: markerId, // Add a unique ID to each marker
        customData: savedMarker
      });
      
      // Add click listener to marker to handle selection as start/end point
      // window.google.maps.event.addListener(marker, 'click', () => {
      //   if (markerMode === 'start') {
      //     selectMarkerAsStart(markerId);
      //     setMarkerMode(null); // Reset mode after selection
      //   } else if (markerMode === 'end') {
      //     selectMarkerAsEnd(markerId);
      //     setMarkerMode(null); // Reset mode after selection
      //   } else {
      //     // Show info window when not in selection mode
      //     if (marker.infoWindow) {
      //       marker.infoWindow.open(mapRef.current, marker);
      //     }
      //   }
      // });
      
      // Create info window for the marker
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3 style="color: #1E90FF;">${savedMarker.name}</h3>
            <p style="color: #555;">${savedMarker.description || 'No description'}</p>
          </div>
        `
      });
      marker.infoWindow = infoWindow;
  
      // Add to markers state
      setMarkers(prev => [...prev, marker]);
      setShowMarkerForm(false);
      
    } catch (error) {
      console.error("Error saving marker:", error);
    }
  }, [mapRef, markerMode, selectMarkerAsStart, selectMarkerAsEnd]);

  const handleCancelMarkerForm = useCallback(() => {
    setShowMarkerForm(false);
  }, []);

  const loadMarkersForBoundary = useCallback(async (boundaryId) => {
    try {
      const response = await MarkerService.getMarkers(boundaryId);
      setSavedMarkers(response.data || []);
      
      // Clear existing markers from map
      markers.forEach(m => m.setMap(null));
      
      // Create new markers on the map
      const newMarkers = response.data.map(markerData => {
        const markerId = `marker-${markerData._id || Date.now()}`;
        const marker = new window.google.maps.Marker({
          position: new window.google.maps.LatLng(
            markerData.position.lat,
            markerData.position.lng
          ),
          map: mapRef.current,
          draggable: true,
          id: markerId, // Add unique ID
          customData: markerData
        });
        
        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div>
              <h3 style="color: #1E90FF;">${markerData.name}</h3>
              <p style="color: #555;">${markerData.description || 'No description'}</p>
            </div>
          `
        });
        marker.infoWindow = infoWindow;
        
        // Add click listener for marker selection or info display
        window.google.maps.event.addListener(marker, 'click', () => {
          setMarkerMode(currentMode => {
            console.log(`Marker clicked. Current mode: ${currentMode}`);
            
            if (currentMode === 'start') {
              selectMarkerAsStart(marker.id);
              return null; // Reset mode after selection
            } else if (currentMode === 'end') {
              selectMarkerAsEnd(marker.id);
              return null; // Reset mode after selection
            } else {
              // Show info window when not in selection mode
              if (marker.infoWindow) {
                marker.infoWindow.open(mapRef.current, marker);
              }
              return currentMode; // Keep current mode
            }
          });
        });
        
        return marker;
      });
      
      setMarkers(newMarkers);
      
    } catch (error) {
      console.error("Error loading markers:", error);
      setSavedMarkers([]);
    }
  }, [mapRef, markers, markerMode, selectMarkerAsStart, selectMarkerAsEnd]);

  // Setup click listener whenever relevant dependencies change
  useEffect(() => {
    setupMapClickListener();
  }, [setupMapClickListener, isDrawingBoundary, boundary]);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    console.log("Map loaded");

    const drawing = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#FF9800',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FF9800',
        editable: true,
        zIndex: 1,
        clickable: false
      },
    });

    drawing.setMap(map);
    setDrawingManager(drawing);

    // Set up initial click listener
    setupMapClickListener();
  }, [setupMapClickListener, mapRef]);

  // Clear existing boundary from map
  const clearExistingBoundary = useCallback(() => {
    if (boundary) {
      boundary.setMap(null);
      setBoundary(null);
      setBoundaryId(null);
    }
  }, [boundary, setBoundary]);

  const startDrawingBoundary = useCallback(() => {
    console.log("Starting to draw boundary");
    if (!drawingManager) {
      console.log("Drawing manager not available");
      return;
    }

    clearExistingBoundary();
    setSelectedBoundary(null);

    setIsDrawingBoundary(true);
    drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);

    // Add a cancellation listener (e.g., for right-click)
    const cancelListener = window.google.maps.event.addListener(mapRef.current, 'rightclick', () => {
      console.log("Drawing cancelled via right click");
      drawingManager.setDrawingMode(null);
      setIsDrawingBoundary(false);
      window.google.maps.event.removeListener(cancelListener);
      
      // Ensure click listener is re-established
      setupMapClickListener();
    });

    window.google.maps.event.addListenerOnce(drawingManager, 'polygoncomplete', (polygon) => {
      console.log("Polygon drawing completed");
      
      // Make the polygon non-clickable to prevent event capturing
      polygon.set('clickable', false);
      
      const paths = polygon.getPaths().getArray()[0].getArray().map(latLng => ({
        lat: latLng.lat(),
        lng: latLng.lng()
      }));
      
      setCurrentBoundaryPaths(paths);
      setBoundary(polygon);
      drawingManager.setDrawingMode(null);
      setIsDrawingBoundary(false);
      
      // Remove the cancellation listener since drawing is complete
      window.google.maps.event.removeListener(cancelListener);
      
      // Filter out markers that are outside the boundary
      const validMarkers = markers.filter(marker => {
        const inside = isMarkerInPolygon(marker, polygon);
        if (!inside) {
          console.log("Removing marker outside boundary");
          marker.setMap(null);
        }
        return inside;
      });
      
      setMarkers(validMarkers);
      console.log("Boundary drawing completed and set");
      
      // Show the form to collect boundary metadata
      setShowBoundaryForm(true);
      
      // Important: Re-establish the click listener after polygon is complete
      setTimeout(() => {
        setupMapClickListener();
      }, 100);
    });
  }, [drawingManager, markers, mapRef, isMarkerInPolygon, setBoundary, setMarkers, setupMapClickListener, clearExistingBoundary]);

  // Load a specific boundary by ID or data
  const loadBoundary = useCallback(async (boundaryData) => {
    if (!mapRef.current) return;
    
    clearExistingBoundary();
    
    try {
      let boundaryToLoad = boundaryData;
      
      // If only ID is provided, fetch the full boundary data
      if (typeof boundaryData === 'string') {
        const response = await BoundaryService.getBoundary(boundaryData);
        boundaryToLoad = response.data;
      }
      
      if (!boundaryToLoad || !boundaryToLoad.paths) {
        console.error("Invalid boundary data", boundaryToLoad);
        return;
      }
      
      // Create polygon from paths
      const polygon = new window.google.maps.Polygon({
        paths: boundaryToLoad.paths,
        strokeColor: '#FF9800',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF9800',
        fillOpacity: 0.35,
        clickable: false
      });
      
      polygon.setMap(mapRef.current);
      setBoundary(polygon);
      setBoundaryId(boundaryToLoad._id);
      setSelectedBoundary(boundaryToLoad);

      // Load markers for this boundary
      if (boundaryToLoad._id) {
        await loadMarkersForBoundary(boundaryToLoad._id);
      }
      
      // Center the map on the boundary
      if (boundaryToLoad.paths && boundaryToLoad.paths.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        
        boundaryToLoad.paths.forEach(path => {
          bounds.extend(new window.google.maps.LatLng(path.lat, path.lng));
        });
        
        mapRef.current.fitBounds(bounds);
      }
      
    } catch (error) {
      console.error("Error loading boundary:", error);
    }
  }, [mapRef, clearExistingBoundary, loadMarkersForBoundary]);

  // Handle form submission
  const handleBoundarySaved = useCallback((boundaryData) => {
    setShowBoundaryForm(false);
    setBoundaryId(boundaryData._id);
    setSelectedBoundary(boundaryData);
    console.log("Boundary saved with ID:", boundaryData._id);
  }, []);

  // Cancel boundary form
  const handleCancelBoundaryForm = useCallback(() => {
    setShowBoundaryForm(false);
    // If user cancels without saving, remove the boundary
    if (boundary && !boundaryId) {
      boundary.setMap(null);
      setBoundary(null);
    }
  }, [boundary, boundaryId]);

  // Add a function to cancel drawing mode
  const cancelDrawingMode = useCallback(() => {
    console.log("Cancelling drawing mode");
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
      setIsDrawingBoundary(false);
      
      // Re-establish click listener
      setupMapClickListener();
    }
  }, [drawingManager, setupMapClickListener]);

  const clearAllData = useCallback(async () => {
    // Clear any existing boundary from the map
    clearExistingBoundary();
    setSelectedBoundary(null);

    // Clear markers
    markers.forEach(m => m.setMap(null));
    setMarkers([]);
    setSavedMarkers([]);
    
    // Reset marker selection mode
    setMarkerMode(null);
  }, [clearExistingBoundary, markers]);

  // Methods for point selection mode
  const setStartPointMode = useCallback(() => {
    console.log("Setting marker mode to 'start'");
    setMarkerMode('start');
  }, []);

  const setEndPointMode = useCallback(() => {
    console.log("Setting marker mode to 'end'");
    setMarkerMode('end');
  }, []);

  const cancelPointSelection = useCallback(() => {
    console.log("Cancelling marker mode"); 
    setMarkerMode(null);
  }, []);

  return {
    onLoad,
    isMarkerInPolygon,
    isPointInPolygon,
    startDrawingBoundary,
    isDrawingBoundary,
    drawingManager,
    cancelDrawingMode,
    clearAllData,
    showBoundaryForm,
    currentBoundaryPaths,
    handleBoundarySaved,
    handleCancelBoundaryForm,
    loadBoundary,
    selectedBoundary,
    boundaryId,
    showMarkerForm,
    currentMarkerPosition,
    handleMarkerSaved,
    handleCancelMarkerForm,
    savedMarkers,
    loadMarkersForBoundary,
    // Route selection mode related
    markerMode,
    setStartPointMode,
    setEndPointMode,
    cancelPointSelection
  };
};