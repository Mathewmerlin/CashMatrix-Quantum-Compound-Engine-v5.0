import React, { createContext, useContext, useState } from 'react';
import defaultLogoImg from '../assets/images/cashmatrix_brand_logo.png';

const STORAGE_KEY = 'cashmatrix_custom_logo';

interface LogoContextType {
  customLogo: string | null;
  defaultLogo: string;
  setCustomLogo: (logo: string | null) => void;
  resetLogo: () => void;
  isLogoModalOpen: boolean;
  openLogoModal: () => void;
  closeLogoModal: () => void;
  uploadLogoFile: (file: File) => Promise<boolean>;
  logoError: string | null;
  setLogoError: (err: string | null) => void;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customLogo, setCustomLogoState] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored.includes('.jpg') || stored.includes('1791395978100'))) {
        localStorage.removeItem(STORAGE_KEY);
        return defaultLogoImg;
      }
      return stored || defaultLogoImg;
    } catch {
      return defaultLogoImg;
    }
  });

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const setCustomLogo = (logo: string | null) => {
    const finalLogo = logo || defaultLogoImg;
    setCustomLogoState(finalLogo);
    try {
      if (logo && logo !== defaultLogoImg) {
        localStorage.setItem(STORAGE_KEY, logo);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save logo to localStorage', e);
    }
  };

  const resetLogo = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setCustomLogoState(defaultLogoImg);
  };

  const openLogoModal = () => {
    setLogoError(null);
    setIsLogoModalOpen(true);
  };

  const closeLogoModal = () => {
    setIsLogoModalOpen(false);
    setLogoError(null);
  };

  const uploadLogoFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      setLogoError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setLogoError('Unsupported file type. Please upload an image (PNG, SVG, JPG, WEBP, or GIF).');
        resolve(false);
        return;
      }

      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        setLogoError('Image size exceeds 5MB. Please upload a smaller image.');
        resolve(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setCustomLogo(result);
          resolve(true);
        } else {
          setLogoError('Failed to read image file.');
          resolve(false);
        }
      };
      reader.onerror = () => {
        setLogoError('An error occurred reading your file.');
        resolve(false);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <LogoContext.Provider
      value={{
        customLogo,
        defaultLogo: defaultLogoImg,
        setCustomLogo,
        resetLogo,
        isLogoModalOpen,
        openLogoModal,
        closeLogoModal,
        uploadLogoFile,
        logoError,
        setLogoError,
      }}
    >
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};
