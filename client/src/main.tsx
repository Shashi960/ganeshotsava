import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';

// Public Pages
import { Home } from './pages/Home';
import { Events } from './pages/Events';
import { CalendarView } from './pages/CalendarView';
import { MembersView } from './pages/MembersView';
import { KatheView } from './pages/KatheView';
import { PrasadaView } from './pages/PrasadaView';
import { AuctionView } from './pages/AuctionView';
import { MediaView } from './pages/MediaView';
import { AboutView } from './pages/AboutView';

// Admin Pages
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminEvents } from './pages/AdminEvents';
import { AdminMembers } from './pages/AdminMembers';
import { AdminPrasada } from './pages/AdminPrasada';
import { AdminSettings } from './pages/AdminSettings';
import { AdminGallery } from './pages/AdminGallery';
import { AdminFinancials } from './pages/AdminFinancials';
import { AdminKathe } from './pages/AdminKathe';
import { AdminAuction } from './pages/AdminAuction';
import { AdminUsers } from './pages/AdminUsers';

import './index.css';

// Route Protection Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

// Root Layout Component
const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pb-16 lg:pb-0">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/members" element={<MembersView />} />
          <Route path="/kathe" element={<KatheView />} />
          <Route path="/prasada" element={<PrasadaView />} />
          <Route path="/auction" element={<AuctionView />} />
          <Route path="/gallery" element={<MediaView />} />
          <Route path="/about" element={<AboutView />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute>
                <AdminEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute>
                <AdminMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/prasada"
            element={
              <ProtectedRoute>
                <AdminPrasada />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/gallery"
            element={
              <ProtectedRoute>
                <AdminGallery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/financials"
            element={
              <ProtectedRoute>
                <AdminFinancials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/kathe"
            element={
              <ProtectedRoute>
                <AdminKathe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/auction"
            element={
              <ProtectedRoute>
                <AdminAuction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <MobileNav />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
