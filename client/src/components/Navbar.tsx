import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
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

  const [customNavEvents, setCustomNavEvents] = React.useState<
    Array<{ _id: string; slug: string; title: string; titleKannada: string }>
  >([]);

  React.useEffect(() => {
    api
      .get('/custom-events')
      .then((res) => {
        if (res.data.status === 'success' && res.data.events) {
          setCustomNavEvents(res.data.events.filter((e: any) => e.showInNavbar !== false));
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-primary text-warm shadow-md border-b-2 border-accent">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4rem] py-1.5 sm:py-0 sm:h-16 gap-2">
          {/* Logo Title */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-1 sm:mr-4">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-accent animate-pulse shrink-0" />
            <span className="font-sanskrit text-xs sm:text-sm md:text-base lg:text-lg font-bold text-accent leading-tight line-clamp-2 sm:line-clamp-none">
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
            <Link to="/tshirt" className={`hover:text-accent font-medium transition ${isActive('/tshirt') ? 'text-accent border-b-2 border-accent' : ''}`}>{language === 'kn' ? 'ಟಿ-ಶರ್ಟ್' : 'T-Shirt'}</Link>
            {customNavEvents.map((evt) => (
              <Link
                key={evt._id}
                to={`/event-reg/${evt.slug}`}
                className={`hover:text-accent font-medium transition ${
                  isActive(`/event-reg/${evt.slug}`) ? 'text-accent border-b-2 border-accent' : ''
                }`}
              >
                {language === 'kn' ? evt.titleKannada : evt.title}
              </Link>
            ))}
            <Link to="/about" className={`hover:text-accent font-medium transition ${isActive('/about') ? 'text-accent border-b-2 border-accent' : ''}`}>{t('navAbout')}</Link>
          </nav>

          {/* Utilities (Language, Auth) */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Language Switcher Button */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-accent/40 bg-primary-dark/50 text-accent font-semibold hover:bg-primary-dark hover:border-accent transition text-xs sm:text-sm"
              title="Switch Language"
            >
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>

            {/* Admin Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center gap-1 text-sm bg-accent text-primary-dark px-3 py-1.5 rounded font-bold hover:bg-accent-light transition"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded text-warm hover:text-red-400 transition"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center gap-1 text-xs sm:text-sm border border-accent text-accent px-2.5 py-1 sm:px-3 sm:py-1.5 rounded font-medium hover:bg-accent hover:text-primary-dark transition"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('navAdmin')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
