import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface AdminGuardProps {
  children: React.ReactNode;
}

function LoadingScreen({ message = 'Verifying Owner/Staff authorization...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center" role="status" aria-label="Loading">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-navy-700 font-semibold text-sm">{message}</span>
      </div>
    </div>
  );
}

// Restricted routes for Staff role (only accessible by Owner/Admin)
const OWNER_ONLY_ROUTES = [
  '/admin/roles',
  '/admin/site-settings',
  '/admin/backups',
  '/admin/theme',
];

export function AdminAuthGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isLoading, isAdminOrStaff, isStaff } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated or not staff/admin/owner, redirect to admin login
    if (!isAuthenticated || !isAdminOrStaff) {
      setLocation('/admin/login');
      return;
    }

    // Enforce Owner-only routes if logged in as Staff
    if (isStaff && OWNER_ONLY_ROUTES.some((route) => location.startsWith(route))) {
      setLocation('/admin');
    }
  }, [isAuthenticated, isLoading, isAdminOrStaff, isStaff, location, setLocation]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !isAdminOrStaff) {
    return <LoadingScreen message="Redirecting to secure login..." />;
  }

  return <>{children}</>;
}

// Guards the /admin/login page itself: bounce already-logged-in admins
// straight to the dashboard instead of showing the login form again.
export function AdminPublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdminOrStaff } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && isAdminOrStaff) {
      setLocation('/admin');
    }
  }, [isAuthenticated, isLoading, isAdminOrStaff, setLocation]);

  if (isLoading) {
    return <LoadingScreen message="Checking session..." />;
  }

  if (isAuthenticated && isAdminOrStaff) {
    return <LoadingScreen message="Redirecting to dashboard..." />;
  }

  return <>{children}</>;
}
