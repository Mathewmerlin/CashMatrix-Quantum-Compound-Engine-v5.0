import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NavModule } from '../types';
import { matrixAudio } from '../utils/matrixAudio';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  login: (password: string) => { success: boolean; error?: string };
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
  isAuthModalOpen: boolean;
  targetModule: NavModule | null;
  openAuthModal: (target?: NavModule) => void;
  closeAuthModal: () => void;
  failedAttempts: number;
  isLockedOut: boolean;
  lockoutRemainingSec: number;
  currentPasswordHint: string;
}

const STORAGE_KEY_AUTH = 'cashmatrix_admin_authenticated';
const STORAGE_KEY_PASS = 'cashmatrix_admin_password';
const DEFAULT_ADMIN_PASSWORD = 'matrix2026';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_SEC = 30;

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true';
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_ADMIN_PASSWORD;
    return localStorage.getItem(STORAGE_KEY_PASS) || DEFAULT_ADMIN_PASSWORD;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [targetModule, setTargetModule] = useState<NavModule | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemainingSec <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemainingSec]);

  const login = useCallback(
    (inputPassword: string): { success: boolean; error?: string } => {
      if (lockoutRemainingSec > 0) {
        matrixAudio.playAccessDenied();
        return {
          success: false,
          error: `Brute force protection active. System locked for ${lockoutRemainingSec}s.`,
        };
      }

      if (inputPassword === adminPassword) {
        setIsAdminAuthenticated(true);
        sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
        setFailedAttempts(0);
        setIsAuthModalOpen(false);
        matrixAudio.playAccessGranted();
        return { success: true };
      }

      // Failed attempt
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      matrixAudio.playAccessDenied();

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutRemainingSec(LOCKOUT_DURATION_SEC);
        return {
          success: false,
          error: `Maximum attempts exceeded. Security lockout engaged for ${LOCKOUT_DURATION_SEC} seconds.`,
        };
      }

      return {
        success: false,
        error: `Access Denied: Invalid cryptographic passcode. (${MAX_ATTEMPTS - newAttempts} attempts remaining)`,
      };
    },
    [adminPassword, failedAttempts, lockoutRemainingSec]
  );

  const logout = useCallback(() => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    matrixAudio.playBeep(350, 0.08, 'square');
  }, []);

  const changePassword = useCallback(
    (oldPass: string, newPass: string): { success: boolean; error?: string } => {
      if (oldPass !== adminPassword) {
        matrixAudio.playAccessDenied();
        return { success: false, error: 'Current passcode verification failed.' };
      }
      if (!newPass || newPass.trim().length < 4) {
        return { success: false, error: 'New passcode must be at least 4 characters.' };
      }
      setAdminPassword(newPass.trim());
      localStorage.setItem(STORAGE_KEY_PASS, newPass.trim());
      matrixAudio.playAccessGranted();
      return { success: true };
    },
    [adminPassword]
  );

  const openAuthModal = useCallback((target?: NavModule) => {
    setTargetModule(target || null);
    setIsAuthModalOpen(true);
    matrixAudio.playBeep(700, 0.04);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminAuthenticated,
        login,
        logout,
        changePassword,
        isAuthModalOpen,
        targetModule,
        openAuthModal,
        closeAuthModal,
        failedAttempts,
        isLockedOut: lockoutRemainingSec > 0,
        lockoutRemainingSec,
        currentPasswordHint: adminPassword,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
