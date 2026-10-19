'use client';

import Link from 'next/link';
import { useSession } from '@/lib/auth/session-context';
import { SOCIAL_LINKS, SUPPORT_EMAIL } from '@/lib/site-config';
import { Film, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

type FooterLink = { href: string; label: string };

const GUEST_LINKS: FooterLink[] = [
  { href: '/find-work', label: 'Find Work' },
  { href: '/browse-crew', label: 'Browse Crew' },
  { href: '/accounts?tab=signup&role=crew', label: 'Create Profile' },
  { href: '/accounts?tab=signin', label: 'Sign In' },
];
const CREW_LINKS: FooterLink[] = [
  { href: '/find-work', label: 'Find Work' },
  { href: '/browse-crew', label: 'Browse Crew' },
  { href: '/dashboard', label: 'My Dashboard' },
  { href: '/dashboard?tab=applications', label: 'My Applications' },
  { href: '/crew/profile-setup', label: 'Edit Profile' },
];
const EMPLOYER_LINKS: FooterLink[] = [
  { href: '/employer/post-requirement', label: 'Post a Job' },
  { href: '/browse-crew', label: 'Browse Crew' },
  { href: '/employer/dashboard', label: 'My Dashboard' },
  { href: '/employer/wishlist', label: 'My Wishlist' },
  { href: '/employer/edit-profile', label: 'Edit Profile' },
];
const ADMIN_LINKS: FooterLink[] = [
  { href: '/admin', label: 'Admin Panel' },
  { href: '/browse-crew', label: 'Browse Crew' },
  { href: '/find-work', label: 'Find Work' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const { heading, links } =
    role === 'EMPLOYER' ? { heading: 'For Employers', links: EMPLOYER_LINKS } :
    role === 'ADMIN' ? { heading: 'Admin', links: ADMIN_LINKS } :
    role === 'CREW' ? { heading: 'For Crew', links: CREW_LINKS } :
    { heading: 'For Crew', links: GUEST_LINKS };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Film className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                MissingCrew
              </span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Connecting talented film crew members with exciting projects worldwide. Your next opportunity is just a click away.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href={SOCIAL_LINKS.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram"
                className="w-9 h-9 bg-gray-800 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 rounded-lg flex items-center justify-center transition-all duration-200 group"
              >
                <Instagram className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </a>
              <a 
                href={SOCIAL_LINKS.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook"
                className="w-9 h-9 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 group"
              >
                <Facebook className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </a>
              <a 
                href={SOCIAL_LINKS.linkedin} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="LinkedIn"
                className="w-9 h-9 bg-gray-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-all duration-200 group"
              >
                <Linkedin className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </a>
              <a 
                href={SOCIAL_LINKS.youtube} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="YouTube"
                className="w-9 h-9 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-200 group"
              >
                <Youtube className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">{heading}</h4>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                  Terms & Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-400">
                <Mail className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-indigo-400 transition-colors duration-200">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Mumbai, India</span>
              </li>
            </ul>
            {role !== 'EMPLOYER' && role !== 'CREW' && role !== 'ADMIN' && (
              <div className="mt-6">
                <Link 
                  href="/accounts?tab=signup&role=employer&intent=post-requirement" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  For Employers
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} MissingCrew. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/terms" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
