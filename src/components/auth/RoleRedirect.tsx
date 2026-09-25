'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/auth/session-context';
import { useRouter } from 'next/navigation';
import { Film, Loader2 } from 'lucide-react';

interface RoleRedirectProps {
  allowedRole?: string; // Role that is allowed to access the page, defaults to 'CREW'
  redirectTo?: string; // Where to redirect if access is not allowed, defaults to '/employer-home'
  children: React.ReactNode;
}

// Full-content loading state shown while the session check runs on reload.
// Matches the header's branding so the brief check reads as intentional.
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[calc(100vh-8rem)] bg-background px-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
        <Film className="h-6 w-6 text-white" />
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export default function RoleRedirect({
  allowedRole = 'CREW',
  redirectTo = '/employer-home',
  children
}: RoleRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role;

      // ADMINs have no place on the crew/employer homes — send them to the
      // admin dashboard instead of bouncing between the two (redirect loop).
      if (userRole === 'ADMIN') {
        router.push('/admin');
        return;
      }

      // If user's role doesn't match the allowed role, redirect
      if (userRole !== allowedRole) {
        router.push(redirectTo);
      }
    }
  }, [status, session, allowedRole, redirectTo, router]);

  // Show children only if user is not authenticated or if they have the correct role
  if (status === 'loading') {
    // Show a loading state while checking authentication
    return <LoadingState message="Checking access…" />;
  }

  if (status === 'authenticated' && session?.user?.role && session.user.role !== allowedRole) {
    // Don't render children if user doesn't have the correct role
    return <LoadingState message="Redirecting…" />;
  }

  return <>{children}</>;
}