import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { ToastProvider } from './components';

// Pages (lazy loaded for better performance)
import React, { Suspense, useEffect, useState } from 'react';

// Wrapper for lazy imports with error handling
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Failed to load component:', error);
      // Return a fallback component
      return { default: () => <div className="loading">Failed to load. <button onClick={() => window.location.reload()}>Retry</button></div> };
    }
  });

const PublicRegistration = lazyWithRetry(() => import('./pages/PublicRegistration'));
const DoctorLogin = lazyWithRetry(() => import('./pages/DoctorLogin'));
const DoctorDashboard = lazyWithRetry(() => import('./pages/DoctorDashboard'));
const CampHeadDashboard = lazyWithRetry(() => import('./pages/CampHeadDashboard'));
const CampHeadDoctors = lazyWithRetry(() => import('./pages/CampHeadDoctors'));
const CampHeadVisitors = lazyWithRetry(() => import('./pages/CampHeadVisitors'));
const AdminLogin = lazyWithRetry(() => import('./pages/AdminLogin'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AdminCampManage = lazyWithRetry(() => import('./pages/AdminCampManage'));

// Protected Route wrapper that handles authentication
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, token, isInitialized } = useAuthStore();
  const { campSlug } = useParams();
  
  if (!isInitialized) {
    return <div className="loading">Loading...</div>;
  }
  
  const isLoggedIn = !!token && !!user;
  const isAdmin = isLoggedIn && user?.role === 'ADMIN';
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  if (!requireAdmin && !isLoggedIn) {
    const loginPath = campSlug ? `/${campSlug}/login` : '/admin/login';
    return <Navigate to={loginPath} replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { initialize, isInitialized, user, token } = useAuthStore();

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Don't render routes until auth is initialized
  if (!isInitialized) {
    return <div className="loading">Initializing auth...</div>;
  }

  return (
    <ToastProvider>
      <div className="app">
        <Suspense fallback={<div className="loading">Loading page...</div>}>
        <Routes>
          {/* Admin routes (no campSlug) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/camps/:campId/manage" 
            element={<ProtectedRoute requireAdmin><AdminCampManage /></ProtectedRoute>} 
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
            element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/:campSlug/doctor/my-patients" 
            element={<ProtectedRoute><CampHeadVisitors /></ProtectedRoute>} 
          />
          
          {/* Protected routes - Camp Head */}
          <Route 
            path="/:campSlug/camp-head" 
            element={<ProtectedRoute><CampHeadDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/:campSlug/camp-head/doctors" 
            element={<ProtectedRoute><CampHeadDoctors /></ProtectedRoute>} 
          />
          <Route 
            path="/:campSlug/camp-head/visitors" 
            element={<ProtectedRoute><CampHeadVisitors /></ProtectedRoute>} 
          />
          
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/admin/login" />} />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={
            <div className="container" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
              <h1>404 - Page Not Found</h1>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-md)' }}>
                Are you looking for the <a href="/#/admin/login" style={{ color: 'var(--color-primary)' }}>Admin Portal</a>?
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
