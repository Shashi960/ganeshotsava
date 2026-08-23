import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'kn';

interface Translations {
  [key: string]: {
    en: string;
    kn: string;
  };
}

export const translations: Translations = {
  aboutIntroPart1: {
    en: "Welcome to the digital home of the **Najagara Ganeshotsava Committee**. We are a non-profit community group dedicated to celebrating the annual Ganesh Chaturthi / Ganeshotsava festival in Najagara. With the support of devotees, we have successfully completed 34 years of celebration and are proudly stepping into our **35th Annual Celebration (2026)**.",
    kn: "ಪ್ರಿಯ ಭಕ್ತರೆ, ನಿಮ್ಮೆಲ್ಲರ ಪ್ರೋತ್ಸಾಹ ಹಾಗೂ ಆದರದ ಅಭಿಮಾನದಿಂದ ನಾವು ಗಣೇಶೋತ್ಸವವನ್ನು ಕಳೆದ 34 ವರ್ಷ ಯಶಸ್ವಿಯಾಗಿ ನಿರ್ವಹಿಸಿ, ಈ ಬಾರಿ 35ನೇ ವರ್ಷದ ಕಾರ್ಯಕ್ರಮಕ್ಕೆ ಅಣಿಯಾಗಿದ್ದೇವೆ."
  },
  aboutIntroPart2: {
    en: "Our objective goes beyond worship: we seek to foster local culture, support traditional arts, host spot-painting and devotional singing programs, organize mass community feasts, and coordinate prasada deliveries for all registered households.",
    kn: "ನಮ್ಮ ಉದ್ದೇಶ ಕೇವಲ ಪೂಜೆಯಷ್ಟೇ ಅಲ್ಲ: ಸ್ಥಳೀಯ ಸಂಸ್ಕೃತಿಯನ್ನು ಬೆಳೆಸುವುದು, ಸಾಂಪ್ರದಾಯಿಕ ಕಲೆಗಳನ್ನು ಪ್ರೋತ್ಸಾಹಿಸುವುದು, ಚಿತ್ರಕಲೆ ಮತ್ತು ಭಕ್ತಿಗೀತೆ ಸ್ಪರ್ಧೆಗಳನ್ನು ಆಯೋಜಿಸುವುದು, ಸಾಮೂಹಿಕ ಅನ್ನದಾನ ನಡೆಸುವುದು ಮತ್ತು ನೋಂದಾಯಿತ ಎಲ್ಲಾ ಮನೆಗಳಿಗೆ ಪ್ರಸಾದವನ್ನು ತಲುಪಿಸುವುದು ನಮ್ಮ ಮುಖ್ಯ ಧ್ಯೇಯವಾಗಿದೆ."
  },
  festivalName: {
    en: 'Najagara Ganeshotsava',
    kn: 'ನಾಜಗಾರ ಗಣೇಶೋತ್ಸವ'
  },
  festivalGreeting: {
    en: 'Happy Ganesh Chaturthi & Ganeshotsava!',
    kn: 'ಶ್ರೀ ಗಣೇಶ ಚತುರ್ಥಿ ಹಾಗೂ ಗಣೇಶೋತ್ಸವದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು!'
  },
  navHome: { en: 'Home', kn: 'ಮುಖಪುಟ' },
  navEvents: { en: 'Events', kn: 'ಕಾರ್ಯಕ್ರಮಗಳು' },
  navCalendar: { en: 'Calendar', kn: 'ಕ್ಯಾಲೆಂಡರ್' },
  navMembers: { en: 'Members', kn: 'ಸದಸ್ಯರು' },
  navJuniorMembers: { en: 'Junior Members', kn: 'ಕಿರಿಯ ಸದಸ್ಯರು' },
  navTeams: { en: 'Teams', kn: 'ಸಮಿತಿಗಳು' },
  navKathe: { en: 'Satya Ganapati Kathe', kn: 'ಸತ್ಯಗಣಪತಿ ಕಥೆ' },
  navVolunteers: { en: 'Volunteers', kn: 'ಸ್ವಯಂಸೇವಕರು' },
  navPrasada: { en: 'Prasada Status', kn: 'ಪ್ರಸಾದ ವಿತರಣೆ' },
  navAuction: { en: 'Auction', kn: 'ಹರಾಜು ವಿವರ' },
  navGallery: { en: 'Gallery', kn: 'ಚಿತ್ರಸಂಪುಟ' },
  navVideos: { en: 'Videos', kn: 'ವೀಡಿಯೋಗಳು' },
  navAbout: { en: 'About Us', kn: 'ಪರಿಚಯ' },
  navAdmin: { en: 'Admin Portal', kn: 'ಆಡಳಿತ ಮಂಡಳಿ' },
  viewFullProgram: { en: 'View Full Program', kn: 'ಕಾರ್ಯಕ್ರಮಗಳ ಪಟ್ಟಿ' },
  viewTodayEvents: { en: 'View Today\'s Events', kn: 'ಇಂದಿನ ಕಾರ್ಯಕ್ರಮಗಳು' },
  previousYears: { en: 'Previous Years', kn: 'ಹಿಂದಿನ ವರ್ಷಗಳು' },
  todaysEventsTitle: { en: 'TODAY\'S SCHEDULE', kn: 'ಇಂದಿನ ಕಾರ್ಯಕ್ರಮಗಳ ವಿವರ' },
  upcomingEventsTitle: { en: 'UPCOMING SCHEDULE', kn: 'ಮುಂದಿನ ಕಾರ್ಯಕ್ರಮಗಳು' },
  countdownBegins: { en: 'Ganeshotsava begins in', kn: 'ಗಣೇಶೋತ್ಸವ ಪ್ರಾರಂಭವಾಗಲು ಇನ್ನು' },
  days: { en: 'days', kn: 'ದಿನಗಳು' },
  countdownDuring: { en: 'Day {day} of Ganeshotsava', kn: 'ಗಣೇಶೋತ್ಸವದ {day}ನೇ ದಿನ' },
  countdownEnded: { en: 'Thank you for celebrating with us.', kn: 'ಉತ್ಸವದಲ್ಲಿ ಭಾಗವಹಿಸಿದ ಭಕ್ತಾದಿಗಳಿಗೆ ಧನ್ಯವಾದಗಳು.' },
  announcementsTitle: { en: 'Announcements', kn: 'ಪ್ರಕಟಣೆಗಳು' },
  registeredHouses: { en: 'Registered Families', kn: 'ನೋಂದಾಯಿತ ಕುಟುಂಬಗಳು' },
  delivered: { en: 'Delivered', kn: 'ಪ್ರಸಾದ ವಿತರಣೆಯಾಗಿದೆ' },
  pending: { en: 'Pending', kn: 'ಬಾಕಿ ಉಳಿದಿದೆ' },
  outForDelivery: { en: 'Out for Delivery', kn: 'ವಿತರಣೆಗೆ ಹೊರಟಿದೆ' },
  assigned: { en: 'Assigned', kn: 'ಸ್ವಯಂಸೇವಕರಿಗೆ ನೀಡಲಾಗಿದೆ' },
  unableToDeliver: { en: 'Unable to Deliver', kn: 'ತಲುಪಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ' },
  registerVrata: { en: 'Register for Vrata', kn: 'ವ್ರತಕ್ಕೆ ಹೆಸರು ನೋಂದಾಯಿಸಿ' },
  financialsTitle: { en: 'Financial Statements', kn: 'ಆಯ-ವ್ಯಯ ಪಟ್ಟಿ' },
  income: { en: 'Income', kn: 'ಜಮಾ' },
  expense: { en: 'Expenditure', kn: 'ಖರ್ಚು' },
  balance: { en: 'Balance Amount', kn: 'ಶಿಲ್ಕು ಮೊತ್ತ' },
  total: { en: 'Total', kn: 'ಒಟ್ಟು' },
  noEventsToday: { en: 'No events scheduled for today.', kn: 'ಇಂದು ಯಾವುದೇ ಕಾರ್ಯಕ್ರಮಗಳು ನಿಗದಿಯಾಗಿಲ್ಲ.' },
  locationLabel: { en: 'Location', kn: 'ಸ್ಥಳ' },
  timeLabel: { en: 'Time', kn: 'ಸಮಯ' },
  categoryLabel: { en: 'Category', kn: 'ವಿಭಾಗ' }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('kn');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved === 'en' || saved === 'kn') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
