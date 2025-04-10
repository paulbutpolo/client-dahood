import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import Auth from './Auth/Auth';
import NotFound from './shared/NotFound';
import Loader from './shared/Loader';
import ProtectedRoute from './ProtectedRoute';
import Dashboard from './Dashboard/Dashboard';
import MapComponent from './Map/Map';
import VideoViewer from './Map/VideoViewer';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (accessToken && refreshToken) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes with redirect if authenticated */}
        <Route 
          path="/auth" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Auth setIsAuthenticated={setIsAuthenticated} />
            )
          } 
        />
        <Route path="/unauthorized" element={<NotFound />} />
        <Route path="/videos/share/:shareableId" element={<VideoViewer />} />
        {/* <Route path="/videos/share/:shareableId/metadata" element={<VideoViewer />} /> */}

        {/* Protected routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                isAuthenticated={isAuthenticated}
                setIsAuthenticated={setIsAuthenticated} 
              />
            } 
          />
          <Route 
            path="/map" 
            element={<MapComponent 
                      isAuthenticated={isAuthenticated}
                      setIsAuthenticated={setIsAuthenticated} 
                    />
            }
          />
        </Route>
        
        {/* Default route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        
        {/* Fallback route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;

// import React from 'react';
// import MapComponent from './MapComponent';

// function App() {
//   return (
//     <div className="App">
//       <h1>Map Application</h1>
//       <MapComponent />
//     </div>
//   );
// }

// export default App;