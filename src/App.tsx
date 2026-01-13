import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { ToastProvider } from './components';

// Pages (lazy loaded for better performance)
import React, { Suspense, useEffect } from 'react';

const PublicRegistration = React.lazy(() => import('./pages/PublicRegistration'));
const DoctorLogin = React.lazy(() => import('./pages/DoctorLogin'));
const DoctorDashboard = React.lazy(() => import('./pages/DoctorDashboard'));
const CampHeadDashboard = React.lazy(() => import('./pages/CampHeadDashboard'));
const CampHeadDoctors = React.lazy(() => import('./pages/CampHeadDoctors'));
const CampHeadVisitors = React.lazy(() => import('./pages/CampHeadVisitors'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminCampManage = React.lazy(() => import('./pages/AdminCampManage'));

function App() {
  const { initialize, isInitialized, user, token } = useAuthStore();

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Don't render routes until auth is initialized
  if (!isInitialized) {
    return <div className="loading">Loading...</div>;
  }

  // Use direct state values for auth checks (more reliable than function calls)
  const isLoggedIn = !!token && !!user;
  const isAdmin = isLoggedIn && user?.role === 'ADMIN';

  return (
    <ToastProvider>
      <div className="app">
        <Suspense fallback={<div className="loading">Loading...</div>}>
        <Routes>
          {/* Admin routes (no campSlug) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/camps/:campId/manage" 
            element={isAdmin ? <AdminCampManage /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin" 
            element={<Navigate to="/admin/dashboard" />} 
          />
          
          {/* Public routes */}
          <Route path="/:campSlug" element={<PublicRegistration />} />
          <Route path="/:campSlug/login" element={<DoctorLogin />} />
          
          {/* Protected routes - Doctor */}
          <Route 
            path="/:campSlug/doctor" 
            element={isLoggedIn ? <DoctorDashboard /> : <Navigate to="/:campSlug/login" />} 
          />
          <Route 
            path="/:campSlug/doctor/my-patients" 
            element={isLoggedIn ? <CampHeadVisitors /> : <Navigate to="/:campSlug/login" />} 
          />
          
          {/* Protected routes - Camp Head */}
          <Route 
            path="/:campSlug/camp-head" 
            element={isLoggedIn ? <CampHeadDashboard /> : <Navigate to="/:campSlug/login" />} 
          />
          <Route 
            path="/:campSlug/camp-head/doctors" 
            element={isLoggedIn ? <CampHeadDoctors /> : <Navigate to="/:campSlug/login" />} 
          />
          <Route 
            path="/:campSlug/camp-head/visitors" 
            element={isLoggedIn ? <CampHeadVisitors /> : <Navigate to="/:campSlug/login" />} 
          />
          
          {/* Fallback */}
          <Route path="/" element={<Navigate to="/admin/login" />} />
          <Route path="*" element={
            <div className="container" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
              <h1>404 - Page Not Found</h1>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-md)' }}>
                Are you looking for the <a href="/admin/login" style={{ color: 'var(--color-primary)' }}>Admin Portal</a>?
              </p>
            </div>
          } />
        </Routes>
      </Suspense>
    </div>
    </ToastProvider>
  );
}

export default App;
