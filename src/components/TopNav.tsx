'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { User } from '@/types';

export type TabType = 'home' | 'profile';

interface TopNavProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TopNav({ user, onSignIn, onSignOut, activeTab, onTabChange }: TopNavProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isSignedIn = user?.email; // User has signed in with email
  const isVerified = user?.email_verified;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
      <div className="h-full max-w-screen-xl mx-auto px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <Image 
            src="/favicon.png" 
            alt="Flicker" 
            width={36}
            height={36}
            className="rounded-xl"
          />
          <span className="text-lg font-semibold text-gray-900 tracking-tight hidden sm:block">Flicker</span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center">
          <NavTab 
            icon={<HomeIcon filled={activeTab === 'home'} />} 
            active={activeTab === 'home'} 
            onClick={() => onTabChange('home')}
            label="Home"
          />
          <NavTab 
            icon={<ProfileIcon filled={activeTab === 'profile'} />} 
            active={activeTab === 'profile'} 
            onClick={() => onTabChange('profile')}
            label="Profile"
          />
        </nav>

        {/* Right: User Menu */}
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-gray-100 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-20 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{user.email}</p>
                          {isVerified ? (
                            <p className="text-xs text-emerald-600 flex items-center gap-1">
                              <CheckIcon /> Verified
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600">
                              Pending verification
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSignOut();
                        }}
                        className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                          <LogoutIcon />
                        </div>
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="btn-gradient"
            >
              Log in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavTab({ 
  icon, 
  active, 
  onClick,
  label 
}: { 
  icon: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 py-2.5 rounded-xl transition-all duration-200
        ${active 
          ? 'text-blue-600 bg-blue-50' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }
      `}
      title={label}
    >
      {icon}
    </button>
  );
}

function HomeIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ) : (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ProfileIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>
  ) : (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
