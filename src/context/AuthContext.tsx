import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppRole, Profile } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { authService, AuthUser, DEMO_ACCOUNTS } from '../lib/authService';

interface AuthContextType {
  currentProfile: Profile | null;
  role: AppRole;
  isAdmin: boolean;
  isStaff: boolean;
  isViewer: boolean;
  isAuthenticated: boolean;
  switchRole: (newRole: AppRole) => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string, role?: AppRole) => Promise<void>;
  loginWithGoogle: (role?: AppRole) => Promise<void>;
  loginAsDemo: (role: AppRole) => Promise<void>;
  logout: () => Promise<void>;
  // Modal controls
  isLoginModalOpen: boolean;
  openLoginModal: (reason?: string) => void;
  closeLoginModal: () => void;
  loginPromptReason: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with saved session or default Admin demo account
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = authService.getSavedSession();
    if (saved) return saved;
    // Default to admin demo account so user can inspect right away
    return DEMO_ACCOUNTS.admin;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return authService.getSavedSession() !== null || true; // true by default since admin demo is preloaded
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState<string | null>(null);

  const role: AppRole = currentUser?.role || 'viewer';

  const openLoginModal = (reason?: string) => {
    setLoginPromptReason(reason || null);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginPromptReason(null);
  };

  const switchRole = (newRole: AppRole) => {
    if (currentUser) {
      const updated: AuthUser = {
        ...currentUser,
        role: newRole,
      };
      setCurrentUser(updated);
      authService.saveSession(updated);
    } else {
      const demo = DEMO_ACCOUNTS[newRole];
      setCurrentUser(demo);
      setIsAuthenticated(true);
      authService.saveSession(demo);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const user = await authService.signInWithEmail(email, password);
    setCurrentUser(user);
    setIsAuthenticated(true);
    closeLoginModal();
  };

  const registerWithEmail = async (name: string, email: string, password: string, targetRole: AppRole = 'staff') => {
    const user = await authService.registerWithEmail(name, email, password, targetRole);
    setCurrentUser(user);
    setIsAuthenticated(true);
    closeLoginModal();
  };

  const loginWithGoogle = async (targetRole: AppRole = 'admin') => {
    const user = await authService.signInWithGoogle(targetRole);
    setCurrentUser(user);
    setIsAuthenticated(true);
    closeLoginModal();
  };

  const loginAsDemo = async (targetRole: AppRole) => {
    const user = await authService.loginAsDemo(targetRole);
    setCurrentUser(user);
    setIsAuthenticated(true);
    closeLoginModal();
  };

  const logout = async () => {
    await authService.signOut();
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const isAdmin = isAuthenticated && role === 'admin';
  const isStaff = isAuthenticated && (role === 'staff' || role === 'admin');
  const isViewer = !isAuthenticated || role === 'viewer';

  return (
    <AuthContext.Provider
      value={{
        currentProfile: currentUser,
        role,
        isAdmin,
        isStaff,
        isViewer,
        isAuthenticated,
        switchRole,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsDemo,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        loginPromptReason,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

