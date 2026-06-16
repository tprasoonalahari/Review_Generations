import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Workspace from './components/Workspace';
import StudioView from './components/StudioView';
import Dashboard from './components/Dashboard';
import ReviewSlidesWorkspace from './components/ReviewSlidesWorkspace';
import SlideReviewStudio from './components/SlideReviewStudio';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/workspace" 
        element={
          <ProtectedRoute>
            <Workspace />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/review/:id" 
        element={
          <ProtectedRoute>
            <StudioView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/review-slides" 
        element={
          <ProtectedRoute>
            <ReviewSlidesWorkspace />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/review-slides/:id" 
        element={
          <ProtectedRoute>
            <SlideReviewStudio />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
