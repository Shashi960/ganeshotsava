import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Calendar, BookOpen, Truck, Menu, X, Users, Image, Info, Shield, Globe, Landmark 
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* Bottom Sticky Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary text-warm border-t border-accent flex justify-around items-center h-16 shadow-lg safe-bottom">
        <NavLink
          to="/"
          onClick={closeMenu}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${isActive && !isMenuOpen ? 'text-accent' : 'text-warm/75'}`
          }
        >
          <Home className="h-5 w-5 mb-0.5" />
          <span>{t('navHome')}</span>
        </NavLink>

        <NavLink
          to="/events"
          onClick={closeMenu}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${isActive && !isMenuOpen ? 'text-accent' : 'text-warm/75'}`
          }
        >
          <Calendar className="h-5 w-5 mb-0.5" />
          <span>{t('navEvents')}</span>
        </NavLink>

        <NavLink
          to="/kathe"
          onClick={closeMenu}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${isActive && !isMenuOpen ? 'text-accent' : 'text-warm/75'}`
          }
        >
          <BookOpen className="h-5 w-5 mb-0.5" />
          <span>{language === 'kn' ? 'ಕಥೆ' : 'Kathe'}</span>
        </NavLink>

        <NavLink
          to="/prasada"
          onClick={closeMenu}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${isActive && !isMenuOpen ? 'text-accent' : 'text-warm/75'}`
          }
        >
          <Truck className="h-5 w-5 mb-0.5" />
          <span>{language === 'kn' ? 'ಪ್ರಸಾದ' : 'Prasada'}</span>
        </NavLink>

        <button
          onClick={toggleMenu}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold transition ${isMenuOpen ? 'text-accent' : 'text-warm/75'}`}
        >
          {isMenuOpen ? <X className="h-5 w-5 mb-0.5 text-accent animate-pulse" /> : <Menu className="h-5 w-5 mb-0.5" />}
          <span>{language === 'kn' ? 'ಇನ್ನಷ್ಟು' : 'More'}</span>
        </button>
      </div>

      {/* Slide-up Menu Drawer Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end">
          {/* Dismiss area */}
          <div className="absolute inset-0 -z-10" onClick={closeMenu}></div>

          {/* Menu Drawer Sheet */}
          <div className="w-full bg-primary border-t-2 border-accent rounded-t-3xl max-h-[85vh] overflow-y-auto pb-24 shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-accent/25">
              <span className="font-sanskrit text-sm font-bold tracking-widest text-accent uppercase">
                {language === 'kn' ? 'ಮುಖ್ಯ ಪಟ್ಟಿ' : 'Navigation Menu'}
              </span>
              <button onClick={closeMenu} className="p-1 text-accent hover:bg-accent/15 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Language Switcher */}
              <div className="bg-primary-dark/40 border border-accent/25 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs font-semibold text-warm-dark flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-accent" />
                  {language === 'kn' ? 'ಭಾಷೆ ಬದಲಾಯಿಸಿ' : 'Choose Language'}
                </span>
                <button
                  onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
                  className="bg-accent hover:bg-accent-light text-primary-dark text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
                </button>
              </div>

              {/* Grid Menu Links */}
              <div className="grid grid-cols-2 gap-3 text-sm text-warm">
                <Link
                  to="/calendar"
                  onClick={closeMenu}
                  className="bg-primary-dark/30 border border-warm/15 hover:border-accent p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition group"
                >
                  <Calendar className="h-6 w-6 text-accent group-hover:scale-110 transition" />
                  <span className="font-medium text-xs">{t('navCalendar')}</span>
                </Link>

                <Link
                  to="/members"
                  onClick={closeMenu}
                  className="bg-primary-dark/30 border border-warm/15 hover:border-accent p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition group"
                >
                  <Users className="h-6 w-6 text-accent group-hover:scale-110 transition" />
                  <span className="font-medium text-xs">{t('navMembers')}</span>
                </Link>

                <Link
                  to="/auction"
                  onClick={closeMenu}
                  className="bg-primary-dark/30 border border-warm/15 hover:border-accent p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition group"
                >
                  <Landmark className="h-6 w-6 text-accent group-hover:scale-110 transition" />
                  <span className="font-medium text-xs">{t('navAuction')}</span>
                </Link>

                <Link
                  to="/gallery"
                  onClick={closeMenu}
                  className="bg-primary-dark/30 border border-warm/15 hover:border-accent p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition group"
                >
                  <Image className="h-6 w-6 text-accent group-hover:scale-110 transition" />
                  <span className="font-medium text-xs">{t('navGallery')}</span>
                </Link>

                <Link
                  to="/about"
                  onClick={closeMenu}
                  className="bg-primary-dark/30 border border-warm/15 hover:border-accent p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition group col-span-2"
                >
                  <Info className="h-6 w-6 text-accent group-hover:scale-110 transition" />
                  <span className="font-medium text-xs">{t('navAbout')}</span>
                </Link>
              </div>

              {/* Admin Portal Redirect Button */}
              <Link
                to={isAuthenticated ? "/admin" : "/admin/login"}
                onClick={closeMenu}
                className="w-full bg-accent hover:bg-accent-light text-primary-dark font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-center shadow-lg"
              >
                <Shield className="h-5 w-5" />
                <span>{isAuthenticated ? 'Admin Dashboard' : t('navAdmin')}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
