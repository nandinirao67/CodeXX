
import React from 'react';
import { ICONS } from '../constants';
import { User, Notification } from '../types';

interface TopNavProps {
  user: User | null;
  notifications: Notification[];
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ user, notifications, isDarkMode, onToggleTheme }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={`h-16 border-b sticky top-0 z-40 px-6 flex items-center justify-between transition-colors duration-300 backdrop-blur-xl ${
      isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-gray-200'
    }`}>
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full hidden lg:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <ICONS.Search />
          </div>
          <input
            type="text"
            className={`block w-full pl-10 pr-3 py-2 border rounded-xl leading-5 transition-all text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
            placeholder="Search global research library..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleTheme}
          className={`p-2 rounded-xl transition-all ${
            isDarkMode ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="Toggle Theme"
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <button className={`relative p-2 rounded-xl transition-all ${
          isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white ring-1 ring-blue-600/50">
              {unreadCount}
            </span>
          )}
        </button>

        <div className={`h-8 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} hidden sm:block`} />

        {user && (
          <div className="flex items-center gap-3 pl-2 group cursor-pointer">
            <div className="text-right hidden md:block">
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{user.name}</p>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{user.role}</p>
            </div>
            <div className="relative">
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-xl border-2 border-transparent group-hover:border-blue-500 transition-all object-cover shadow-lg shadow-blue-500/10"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;
