'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/login').then(r => r.json()).then(data => {
      if (data.user) setUser(data.user);
      else router.push('/login');
    }).catch(() => router.push('/login'));
  }, []);

  const navItems = [
    { href: '/dashboard', label: '工作台', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
    { href: '/projects', label: '项目管理', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { href: '/requirements', label: '需求管理', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { href: '/tasks', label: '任务看板', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7' },
    { href: '/members', label: '团队成员', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-30 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {sidebarOpen ? (
            <h1 className="text-lg font-bold text-gray-900">📋 PLM 管家</h1>
          ) : (
            <h1 className="text-lg font-bold text-gray-900">📋</h1>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
            </svg>
          </button>
        </div>
        <nav className="mt-4 px-2 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div>
            <h2 className="text-sm font-medium text-gray-500">
              {navItems.find(i => pathname.startsWith(i.href))?.label || '工作台'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role === 'admin' ? '管理员' : user.role === 'manager' ? '项目经理' : '成员'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600" title="退出登录">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
