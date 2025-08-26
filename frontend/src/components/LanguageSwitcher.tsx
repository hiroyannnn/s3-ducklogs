import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button
        onClick={() => changeLanguage('ja')}
        className={`lang-btn ${i18n.language === 'ja' ? 'active' : ''}`}
      >
        日本語
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
