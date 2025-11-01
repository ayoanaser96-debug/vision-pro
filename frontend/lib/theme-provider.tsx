'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'ar';
  currency: string;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: 'en' | 'ar') => void;
  setCurrency: (currency: string) => void;
  isRTL: boolean;
  actualTheme: 'light' | 'dark';
}

// Provide default values to prevent undefined context errors
const defaultThemeContext: ThemeContextType = {
  theme: 'light',
  language: 'en',
  currency: 'USD',
  setTheme: () => {},
  setLanguage: () => {},
  setCurrency: () => {},
  isRTL: false,
  actualTheme: 'light',
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'auto'>('light');
  const [language, setLanguageState] = useState<'en' | 'ar'>('en');
  const [currency, setCurrencyState] = useState<string>('USD');
  const [loading, setLoading] = useState(true);

  // Calculate actual theme (handles 'auto' mode)
  const getActualTheme = (currentTheme: 'light' | 'dark' | 'auto'): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    if (currentTheme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
  };

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
      return getActualTheme(savedTheme || 'light');
    }
    return 'light';
  });
  const isRTL = language === 'ar';

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.get('/admin/settings');
          if (res.data) {
            setThemeState(res.data.theme || 'light');
            setLanguageState(res.data.language || 'en');
            setCurrencyState(res.data.currency || 'USD');
          }
        }
      } catch (error) {
        // Load from localStorage if backend unavailable
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
        const savedLanguage = localStorage.getItem('language') as 'en' | 'ar' | null;
        const savedCurrency = localStorage.getItem('currency');
        
        if (savedTheme) setThemeState(savedTheme);
        if (savedLanguage) setLanguageState(savedLanguage);
        if (savedCurrency) setCurrencyState(savedCurrency);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const actual = getActualTheme(theme);
    setActualTheme(actual);
    
    const root = document.documentElement;
    const body = document.body;
    
    if (actual === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes if in auto mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const actual = mediaQuery.matches ? 'dark' : 'light';
        setActualTheme(actual);
        
        // Update DOM immediately
        const root = document.documentElement;
        const body = document.body;
        if (actual === 'dark') {
          root.classList.add('dark');
          body.classList.add('dark');
        } else {
          root.classList.remove('dark');
          body.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Apply language/RTL to document
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const html = document.documentElement;
    html.setAttribute('lang', language);
    html.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    
    if (isRTL) {
      html.classList.add('rtl');
      document.body.classList.add('rtl');
    } else {
      html.classList.remove('rtl');
      document.body.classList.remove('rtl');
    }
    
    localStorage.setItem('language', language);
  }, [language, isRTL]);

  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Save to backend if admin
    const token = localStorage.getItem('token');
    if (token) {
      api.put('/admin/settings', { theme: newTheme, language, currency }).catch(() => {
        // Silently fail if not admin
      });
    }
  };

  const setLanguage = (newLanguage: 'en' | 'ar') => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Save to backend if admin
    const token = localStorage.getItem('token');
    if (token) {
      api.put('/admin/settings', { theme, language: newLanguage, currency }).catch(() => {
        // Silently fail if not admin
      });
    }
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
    
    // Save to backend if admin
    const token = localStorage.getItem('token');
    if (token) {
      api.put('/admin/settings', { theme, language, currency: newCurrency }).catch(() => {
        // Silently fail if not admin
      });
    }
  };

  // Always provide context, even during loading
  return (
    <ThemeContext.Provider
      value={{
        theme,
        language,
        currency,
        setTheme,
        setLanguage,
        setCurrency,
        isRTL,
        actualTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // Context should never be undefined now since we provide default value
  return context;
}

