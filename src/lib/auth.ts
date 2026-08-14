import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Auto-cleanup legacy local authentication storage keys
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('meggs_kitchen_seed_users');
    localStorage.removeItem('meggs_kitchen_current_session');
    localStorage.removeItem('meggs_kitchen_active_user');
    sessionStorage.removeItem('meggs_kitchen_current_session');
  } catch {
    // Ignore storage access errors in private/sandboxed windows
  }
}

export type UserRole = 'owner' | 'staff' | 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  company_name?: string | null;
  tax_pin?: string | null;
  avatar_url?: string | null;
  is_b2b?: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  permissions: string[];
  isAuthenticated: boolean;
  loading: boolean;
}

const ROLE_PERMISSIONS_MAP: Record<UserRole, string[]> = {
  owner: [
    'all.access',
    'dashboard:view',
    'financials:view',
    'products:view',
    'products:write',
    'inventory:view',
    'inventory:write',
    'orders:view',
    'orders:write',
    'customers:view',
    'customers:write',
    'suppliers:view',
    'suppliers:write',
    'promotions:view',
    'promotions:write',
    'settings:view',
    'settings:write',
    'roles:manage',
    'reports:view',
    'audit:view',
    'backups:manage',
  ],
  admin: [
    'all.access',
    'dashboard:view',
    'financials:view',
    'products:view',
    'products:write',
    'inventory:view',
    'inventory:write',
    'orders:view',
    'orders:write',
    'customers:view',
    'customers:write',
    'suppliers:view',
    'suppliers:write',
    'promotions:view',
    'promotions:write',
    'settings:view',
    'settings:write',
    'roles:manage',
    'reports:view',
    'audit:view',
  ],
  staff: [
    'dashboard:view',
    'products:view',
    'products:write',
    'inventory:view',
    'inventory:write',
    'orders:view',
    'orders:write',
    'customers:view',
    'customers:write',
    'suppliers:view',
    'leads:view',
    'leads:write',
  ],
  customer: [
    'shop:browse',
    'cart:checkout',
    'orders:view_own',
    'profile:manage',
    'reviews:write',
  ],
};

export function getPermissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS_MAP[role] || ROLE_PERMISSIONS_MAP.customer;
}

/**
 * Fetch profile directly from Supabase `profiles` table
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If table doesn't have the user yet, return null
      console.warn('[MEGGS KITCHEN Auth] Profile lookup notification:', error.message);
      return null;
    }

    return {
      ...data,
      role: (data.role?.toLowerCase() as UserRole) || 'customer',
    };
  } catch (err) {
    console.error('[MEGGS KITCHEN Auth] Error fetching profile:', err);
    return null;
  }
}

/**
 * Sign in using Supabase Auth
 */
export async function signInWithEmail(email: string, password: string): Promise<{ session: Session | null; user: User | null; profile: UserProfile | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { session: null, user: null, profile: null, error };
    }

    let profile: UserProfile | null = null;
    if (data.user) {
      profile = await fetchUserProfile(data.user.id);
      // If profile doesn't exist, create a fallback profile based on metadata
      if (!profile) {
        profile = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          phone: data.user.user_metadata?.phone || null,
          role: (data.user.user_metadata?.role?.toLowerCase() as UserRole) || 'customer',
          company_name: data.user.user_metadata?.company_name || null,
          is_active: true,
        };
      }
    }

    return { session: data.session, user: data.user, profile, error: null };
  } catch (err) {
    return {
      session: null,
      user: null,
      profile: null,
      error: err instanceof Error ? err : new Error('Authentication failed'),
    };
  }
}

/**
 * Register a new user with Supabase Auth
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: {
    fullName: string;
    phone?: string;
    companyName?: string;
    role?: UserRole;
  }
): Promise<{ user: User | null; error: Error | null }> {
  try {
    const targetRole = metadata.role || 'customer';
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: metadata.fullName,
          phone: metadata.phone || null,
          company_name: metadata.companyName || null,
          role: targetRole,
        },
      },
    });

    if (error) {
      return { user: null, error };
    }

    if (data.user) {
      // Upsert profile record into public.profiles
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email.trim().toLowerCase(),
        full_name: metadata.fullName,
        phone: metadata.phone || null,
        company_name: metadata.companyName || null,
        role: targetRole,
        is_active: true,
      });
    }

    return { user: data.user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err : new Error('Sign up failed'),
    };
  }
}

/**
 * Sign out of Supabase Auth
 */
export async function signOutUser(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Sign out failed') };
  }
}

/**
 * Send password reset email via Supabase Auth
 */
export async function resetPasswordForEmail(email: string, redirectTo?: string): Promise<{ error: Error | null }> {
  try {
    const redirectUrl = redirectTo || `${window.location.origin}/admin/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl,
    });
    return { error };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Password reset failed') };
  }
}

/**
 * Update authenticated user's password
 */
export async function updateAuthPassword(newPassword: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Password update failed') };
  }
}

/**
 * Update user profile in Supabase profiles table
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ profile: UserProfile | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data, error: null };
  } catch (err) {
    return {
      profile: null,
      error: err instanceof Error ? err : new Error('Profile update failed'),
    };
  }
}
