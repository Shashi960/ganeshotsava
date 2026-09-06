import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Flame, Sparkles, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  forceShow?: boolean;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ forceShow = false, onFinish }) => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState<boolean>(false);
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has already seen splash screen in this session
    const hasSeenSplash = sessionStorage.getItem('chouti_splash_viewed');
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!hasSeenSplash || forceShow) {
      setVisible(true);

      // Auto-dismiss after 2.8 seconds
      timer = setTimeout(() => {
        dismissSplash();
      }, 2800);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [forceShow]);

  const dismissSplash = () => {
    setFadingOut(true);
    setTimeout(() => {
      sessionStorage.setItem('chouti_splash_viewed', 'true');
      setVisible(false);
      if (onFinish) onFinish();
    }, 450);
  };

  if (!visible) return null;

  return (
    <div
      onClick={dismissSplash}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-4 sm:p-6 select-none cursor-pointer overflow-hidden transition-all duration-500 ease-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, #3D0B14 0%, #1E0509 55%, #0D0204 100%)',
      }}
      role="dialog"
      aria-label="Welcome Splash Screen"
    >
      {/* Decorative Aura Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] bg-accent/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Header: Auspicious Invocation */}
      <div className="w-full max-w-md pt-2 sm:pt-4 text-center z-10 space-y-1 sm:space-y-1.5 animate-fadeIn">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent text-xs sm:text-sm font-bold tracking-widest uppercase shadow-md">
          <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent animate-pulse" />
          <span>{language === 'kn' ? '॥ ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ ॥' : '॥ Om Shri Ganeshaya Namaha ॥'}</span>
          <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent animate-pulse" />
        </div>

        <h1 className="text-sm sm:text-base md:text-lg font-bold text-warm-dark font-kannada tracking-wide drop-shadow">
          {language === 'kn'
            ? 'ಗಣೇಶೋತ್ಸವ ಸಮಿತಿ, ಕೆಳಗಿನೂರು, ನಾಜಗಾರ ಕ್ರಾಸ್'
            : 'Ganeshotsava Samiti, Kelaginuru, Najagara Cross'}
        </h1>
      </div>

      {/* Centerpiece: Lord Ganesha Portrait */}
      <div className="relative z-10 flex flex-col items-center my-auto py-2">
        <div className="relative group">
          {/* Golden Glow Rings */}
          <div className="absolute -inset-1 sm:-inset-1.5 bg-gradient-to-r from-accent via-secondary to-accent rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-500"></div>

          {/* Portrait Container */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-3 border-accent/80 shadow-[0_10px_40px_rgba(0,0,0,0.85)] max-h-[50vh] sm:max-h-[55vh] aspect-[9/16] bg-black">
            <img
              src="/ganesha-splash.jpg"
              alt="Lord Ganesha"
              className="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition duration-700 ease-out"
              loading="eager"
            />
            {/* Soft divine bottom gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Subtitle Banner under portrait */}
        <div className="mt-3 sm:mt-4 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-accent font-sanskrit text-xs sm:text-sm font-bold tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>35th Ganeshotsava 2025</span>
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <p className="text-xs sm:text-sm text-warm/90 font-medium font-kannada">
            {language === 'kn' ? 'ಸರ್ವರಿಗೂ ಹಾರ್ದಿಕ ಸುಸ್ವಾಗತ' : 'Hearty Welcome to All Devotees'}
          </p>
        </div>
      </div>

      {/* Bottom Action / Enter Prompt */}
      <div className="w-full max-w-md pb-3 sm:pb-5 z-10 flex flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissSplash();
          }}
          className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-accent hover:bg-accent-light text-primary-dark font-extrabold text-xs sm:text-sm shadow-xl transform active:scale-95 transition"
        >
          <span>{language === 'kn' ? 'ವೆಬ್‌ಸೈಟ್‌ಗೆ ಪ್ರವೇಶಿಸಿ' : 'Enter Website'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Progress bar indication */}
        <div className="w-44 sm:w-56 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full"
            style={{
              animation: 'splashProgress 2.8s linear forwards',
            }}
          />
        </div>
        <span className="text-[10px] text-warm/50 font-medium">
          {language === 'kn' ? 'ಮುಂದುವರಿಯಲು ಎಲ್ಲಿಯಾದರೂ ಸ್ಪರ್ಶಿಸಿ' : 'Tap anywhere to enter'}
        </span>
      </div>

      {/* Keyframe animation for progress line */}
      <style>{`
        @keyframes splashProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
