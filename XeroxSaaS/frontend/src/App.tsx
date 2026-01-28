import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RegisterShop from './pages/RegisterShop';
import RegisterStudent from './pages/RegisterStudent';
import ShopSetup from './pages/ShopSetup';
import ShopDashboard from './pages/ShopDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { AuthContext } from './context/AuthContext';
import ShopSettings from './pages/ShopSettings';

// Simple Route Protection Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, isLoading } = useContext(AuthContext)!;

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-shop" element={<RegisterShop />} />
      <Route path="/register-student" element={<RegisterStudent />} />

      {/* Protected Routes for Shop Owners */}
      <Route path="/shop/setup" element={
        <ProtectedRoute allowedRoles={['OWNER']}>
          <ShopSetup />
        </ProtectedRoute>
      } />
      
      <Route path="/shop/dashboard" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}>
          <ShopDashboard />
        </ProtectedRoute>
      } />

      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/shop/settings" element={
        <ProtectedRoute allowedRoles={['OWNER']}>
          <ShopSettings />
        </ProtectedRoute>
      } />
    </Routes>
    
  );
}

export default App;