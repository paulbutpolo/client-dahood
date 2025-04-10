import React from 'react';
import StreetViewTour from './StreetViewTour';

const StreetViewModal = ({ 
  optimizedRoute, 
  onClose, 
  onCapture, 
  transcodeImagesToVideo 
}) => (
  <div className="street-view-modal" style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    zIndex: 1000
  }}>
    <StreetViewTour 
      route={optimizedRoute}
      onClose={onClose}
      onCapture={onCapture}
      transcodeImagesToVideo={transcodeImagesToVideo}
    />
  </div>
);

export default StreetViewModal;