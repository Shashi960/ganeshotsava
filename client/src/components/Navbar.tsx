import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Flame, LogOut, User, LayoutDashboard, Globe } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-primary text-warm shadow-md border-b-2 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Title */}
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-accent animate-pulse" />
            <span className="font-sanskrit text-lg sm:text-xl font-bold tracking-widest text-accent">
              {t('festivalName')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/" className={`hover:text-accent font-medium transition ${isActive('/') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navHome')}</Link>
            <Link to="/events" className={`hover:text-accent font-medium transition ${isActive('/events') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navEvents')}</Link>
            <Link to="/calendar" className={`hover:text-accent font-medium transition ${isActive('/calendar') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navCalendar')}</Link>
            <Link to="/members" className={`hover:text-accent font-medium transition ${isActive('/members') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navMembers')}</Link>
            <Link to="/kathe" className={`hover:text-accent font-medium transition ${isActive('/kathe') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navKathe')}</Link>
            <Link to="/prasada" className={`hover:text-accent font-medium transition ${isActive('/prasada') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navPrasada')}</Link>
            <Link to="/auction" className={`hover:text-accent font-medium transition ${isActive('/auction') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navAuction')}</Link>
            <Link to="/gallery" className={`hover:text-accent font-medium transition ${isActive('/gallery') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navGallery')}</Link>
            <Link to="/about" className={`hover:text-accent font-medium transition ${isActive('/about') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navAbout')}</Link>
          </nav>

          {/* Utilities (Language, Auth) */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher Button */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent/40 bg-primary-dark/50 text-accent font-semibold hover:bg-primary-dark hover:border-accent transition text-sm"
              title="Switch Language"
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>

            {/* Admin Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center gap-1 text-sm bg-accent text-primary-dark px-3 py-1.5 rounded font-bold hover:bg-accent-light transition"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded text-warm hover:text-red-400 transition"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center gap-1 text-sm border border-accent text-accent px-3 py-1.5 rounded font-medium hover:bg-accent hover:text-primary-dark transition"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('navAdmin')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
