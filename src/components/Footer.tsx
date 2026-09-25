import Link from 'next/link';
import { Film, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all duration-200 group">
                <Facebook className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all duration-200 group">
                <Twitter className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all duration-200 group">
                <Instagram className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all duration-200 group">
                <Linkedin className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">For Crew</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/find-work" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                  Find Work
                </Link>
              </li>
              <li>
                <Link href="/browse-crew" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                  Browse Crew
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href="/crew/profile-setup" className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                  Create Profile
                </Link>
              </li>
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
                <a href="mailto:support@missingcrew.com" className="hover:text-indigo-400 transition-colors duration-200">
                  support@missingcrew.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <Phone className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <a href="tel:+1234567890" className="hover:text-indigo-400 transition-colors duration-200">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Mumbai, India</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link 
                href="/employer/dashboard" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                For Employers
              </Link>
            </div>
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
