"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth/session-context';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from './notifications/NotificationBell';
import { Film, Menu, X, User, LogOut, Briefcase, Users, Search } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Safely check if the dropdown is open and if the click is outside
      if (isDropdownOpen &&
          dropdownRef.current &&
          (dropdownRef.current as HTMLElement) &&
          !(dropdownRef.current as HTMLElement).contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    // Only add event listener if dropdown is open
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const pathname = usePathname();
  const isEmployerContext = pathname?.startsWith('/employer') || pathname === '/employer-home';
  const selectedRole = isEmployerContext ? 'employer' : 'crew';
  const signInHref = `/accounts?tab=signin&role=${selectedRole}` as const;
  const joinHref = `/accounts?tab=signup&role=${selectedRole}` as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                <Film className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                MissingCrew
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              href={session?.user?.role === 'EMPLOYER' ? '/employer-home' : '/crew-home'} 
              className="px-4 py-2 text-foreground hover:text-primary font-medium rounded-lg hover:bg-accent transition-all duration-200"
            >
              Home
            </Link>
            <Link 
              href="/browse-crew" 
              className="px-4 py-2 text-foreground hover:text-primary font-medium rounded-lg hover:bg-accent transition-all duration-200 flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Browse Crew
            </Link>
            <Link 
              href="/find-work" 
              className="px-4 py-2 text-foreground hover:text-primary font-medium rounded-lg hover:bg-accent transition-all duration-200 flex items-center gap-1"
            >
              <Search className="h-4 w-4" />
              Find Work
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {session ? (
              <div className="flex items-center space-x-3">
                <NotificationBell />
                <Link
                  href={session.user?.role === 'CREW' ? '/dashboard' :
                        session.user?.role === 'EMPLOYER' ? '/employer/dashboard' :
                        session.user?.role === 'ADMIN' ? '/admin' :
                        '/dashboard'}
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary font-medium rounded-lg hover:bg-accent transition-all duration-200"
                >
                  <Briefcase className="h-4 w-4" />
                  Dashboard
                </Link>
                
                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
                  >
                    {session.user?.image ? (
                      <div className="relative">
                        <Image
                          src={session.user.image}
                          alt="User Avatar"
                          width={40}
                          height={40}
                          className="rounded-full ring-2 ring-border hover:ring-primary transition-all duration-200"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold ring-2 ring-border hover:ring-primary transition-all duration-200 shadow-md">
                        {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-card rounded-xl shadow-xl py-2 border border-border z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground">{session.user?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{session.user?.email}</p>
                      </div>
                      <div className="py-2">
                        <Link
                          href={session.user?.role === 'EMPLOYER' ? '/employer/edit-profile' : '/crew/profile-setup'}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-primary transition-all duration-200"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Edit Profile
                        </Link>
                        <Link
                          href={session.user?.role === 'CREW' ? '/dashboard' :
                                session.user?.role === 'EMPLOYER' ? '/employer/dashboard' :
                                session.user?.role === 'ADMIN' ? '/admin' :
                                '/dashboard'}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-primary transition-all duration-200 md:hidden"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Briefcase className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            signOut('/crew-home')
                            setIsDropdownOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link 
                  href={signInHref}
                  className="hidden md:inline-flex px-4 py-2 text-foreground hover:text-primary font-medium rounded-lg hover:bg-accent transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link 
                  href="/accounts?tab=signup&role=employer&intent=post-requirement" 
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary font-medium rounded-lg hover:bg-accent transition-all duration-200"
                >
                  <Briefcase className="h-4 w-4" />
                  Post a Job
                </Link>
                <Link
                  href={joinHref}
                  className="inline-flex items-center justify-center whitespace-nowrap px-3.5 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Join Now
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 flex-shrink-0 text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all duration-200"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/"
                className="px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-lg font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/browse-crew"
                className="flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-lg font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                Browse Crew
              </Link>
              <Link
                href="/find-work"
                className="flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-lg font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Search className="h-4 w-4" />
                Find Work
              </Link>
              {!session && (
                <>
                  <Link
                    href={signInHref}
                    className="px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/accounts?tab=signup&role=employer&intent=post-requirement"
                    className="flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Briefcase className="h-4 w-4" />
                    Post a Job
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
