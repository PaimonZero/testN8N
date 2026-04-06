import React, { createContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';
import { getRateLimitStatus } from '../services/api';

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('vi');
  
  // API Keys — stored in memory only, never in localStorage
  const [userKeys, setUserKeys] = useState({
    geminiApiKey: '',
    anthropicApiKey: '',
    mapboxApiKey: '',
    serperApiKey: '',
  });
  const [adminCode, setAdminCode] = useState('');
  
  // Rate limit status
  const [rateLimitStatus, setRateLimitStatus] = useState({ remaining: null, limit: 50, used: 0 });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const refreshRateLimit = useCallback(async () => {
    // Note: To properly get initial status, we pass the current keys
    const status = await getRateLimitStatus(userKeys, 'gemini', adminCode);
    if (status) {
      setRateLimitStatus(status);
    }
  }, [userKeys, adminCode]);

  useEffect(() => {
    refreshRateLimit();
  }, [refreshRateLimit]);

  const t = translations[lang];

  return (
    <SettingsContext.Provider value={{ 
      theme, setTheme, 
      lang, setLang, 
      t,
      userKeys, setUserKeys,
      adminCode, setAdminCode,
      rateLimitStatus, setRateLimitStatus, refreshRateLimit,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
