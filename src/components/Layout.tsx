import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, BarChart3, Search, LogOut, Trophy, User, Users } from 'lucide-react';
import clsx from 'clsx';
import { DiamondIQLogo } from './DiamondIQLogo';
import { MigrationPrompt } from './MigrationPrompt';
import { useAuth } from '@/contexts/AuthContext';
import { shouldPromptMigration } from '@/services/migrationService';
import { isSupabaseConfigured } from '@/lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showMigration, setShowMigration] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check for migration prompt on mount
  useEffect(() => {
    if (user && isSupabaseConfigured && shouldPromptMigration(user.id)) {
      setShowMigration(true);
    }
  }, [user]);

  const handleMigrationComplete = () => {
    setShowMigration(false);
  };

  const navItems = [
    { name: 'Scenarios', path: '/', icon: Search },
    { name: 'Training', path: '/drill', icon: Zap },
    { name: 'Progress', path: '/progress', icon: BarChart3 },
    ...(isSupabaseConfigured ? [
      { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
      { name: 'Teams', path: '/teams', icon: Users },
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen w-full bg-background text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 glass hidden md:flex flex-col border-r border-white/10">
        <div className="p-6 flex items-center space-x-3">
          <DiamondIQLogo size="small" showText={false} />
          <span className="text-xl font-bold tracking-tight">Diamond IQ</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                  active
                    ? 'nav-active text-primary'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        {user && (
          <div className="p-4 border-t border-white/10">
            <div className="bg-surface/50 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-gray-400">Signed in as</p>
              <p className="text-sm font-semibold text-white truncate mt-1">
                {user.email}
              </p>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 mt-3 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />
        <div className="relative z-10">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-center p-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <DiamondIQLogo size="small" showText={false} />
              <span className="text-lg font-bold">Diamond IQ</span>
            </div>
          </div>

          {/* Page Content - extra bottom padding on mobile for nav bar */}
          <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-dark border-t border-white/10 z-50">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]',
                  active
                    ? 'text-primary'
                    : 'text-gray-400'
                )}
              >
                <Icon className={clsx('w-6 h-6', active && 'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]')} />
                <span className="text-xs mt-1 font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* User/Profile Button */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={clsx(
              'flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]',
              showUserMenu ? 'text-primary' : 'text-gray-400'
            )}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Account</span>
          </button>
        </div>

        {/* Mobile User Menu Popup */}
        {showUserMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUserMenu(false)}
            />
            <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 glass-dark rounded-xl border border-white/10 p-4 z-50">
              {user && (
                <>
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate mt-1">
                    {user.email}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 mt-4 w-full py-2 px-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </nav>

      {/* Migration Prompt */}
      {user && (
        <MigrationPrompt
          open={showMigration}
          userId={user.id}
          onComplete={handleMigrationComplete}
        />
      )}
    </div>
  );
};

export default Layout;
