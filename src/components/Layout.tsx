import React from 'react';
import { Shield, BarChart3, FileText, Activity } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'surveys' | 'analytics' | 'audit';
  onPageChange: (page: 'surveys' | 'analytics' | 'audit') => void;
}

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const navItems = [
    { id: 'surveys' as const, label: 'Surveys', icon: FileText },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'audit' as const, label: 'Audit Logs', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Surveys Galore</h1>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onPageChange(id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}