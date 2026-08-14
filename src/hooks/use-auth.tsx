import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import {
  UserProfile,
  UserRole,
  fetchUserProfile,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  resetPasswordForEmail,
  updateAuthPassword,
  getPermissionsForRole,
} from '@/lib/auth';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  isAdminOrStaff: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  register: (
    email: string,
    password: string,
    metadata: { fullName: string; phone?: string; companyName?: string; role?: UserRole }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string, redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (targetUser: User | null): Promise<UserProfile | null> => {
    if (!targetUser) {
      setProfile(null);
      return null;
    }

    let userProfile = await fetchUserProfile(targetUser.id);
    if (!userProfile) {
      // Fallback profile if record is still being created
      userProfile = {
        id: targetUser.id,
        email: targetUser.email || '',
        full_name: targetUser.user_metadata?.full_name || targetUser.email?.split('@')[0] || 'User',
        phone: targetUser.user_metadata?.phone || null,
        role: (targetUser.user_metadata?.role?.toLowerCase() as UserRole) || 'customer',
        company_name: targetUser.user_metadata?.company_name || null,
        is_active: true,
      };
    }
    setProfile(userProfile);
    return userProfile;
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Initial session restoration
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await loadProfile(currentSession.user);
      }
      setIsLoading(false);
    }).catch((err) => {
      console.warn('[MEGGS KITCHEN Auth] Session restoration error:', err);
      if (isMounted) setIsLoading(false);
    });

    // Listen to real-time auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await loadProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { session: newSession, user: authUser, profile: userProfile, error } = await signInWithEmail(email, password);
    setIsLoading(false);

    if (error || !authUser) {
      return { success: false, error: error?.message || 'Invalid login credentials' };
    }

    setSession(newSession);
    setUser(authUser);
    setProfile(userProfile);

    return {
      success: true,
      role: userProfile?.role,
    };
  };

  const register = async (
    email: string,
    password: string,
    metadata: { fullName: string; phone?: string; companyName?: string; role?: UserRole }
  ) => {
    setIsLoading(true);
    const { user: newUser, error } = await signUpWithEmail(email, password, metadata);
    setIsLoading(false);

    if (error || !newUser) {
      return { success: false, error: error?.message || 'Registration failed' };
    }

    await loadProfile(newUser);
    return { success: true };
  };

  const logout = async () => {
    setIsLoading(true);
    await signOutUser();
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  };

  const resetPassword = async (email: string, redirectTo?: string) => {
    const { error } = await resetPasswordForEmail(email, redirectTo);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await updateAuthPassword(newPassword);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const role: UserRole | null = profile?.role || (user?.user_metadata?.role?.toLowerCase() as UserRole) || null;
  const permissions: string[] = role ? getPermissionsForRole(role) : [];
  const isAuthenticated = !!session && !!user;
  const isOwner = role === 'owner' || role === 'admin';
  const isStaff = role === 'staff';
  const isCustomer = role === 'customer';
  const isAdminOrStaff = isOwner || isStaff;

  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated) return false;
    if (permissions.includes('all.access')) return true;
    return permissions.includes(permission);
  };

  const value: AuthContextValue = {
    session,
    user,
    profile,
    role,
    permissions,
    isAuthenticated,
    isLoading,
    isOwner,
    isStaff,
    isCustomer,
    isAdminOrStaff,
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    refreshProfile,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
