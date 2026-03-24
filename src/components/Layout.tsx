import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { LayoutDashboard, Users, UserCircle, ListOrdered, Settings, Menu, X } from 'lucide-react';

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'queue', label: 'Antrian', icon: ListOrdered },
  { id: 'customers', label: 'Pelanggan', icon: Users },
  { id: 'therapists', label: 'Terapis', icon: UserCircle },
  { id: 'services', label: 'Layanan', icon: Settings },
];

export function Layout({ children, activeTab, onTabChange }: { children: React.ReactNode; activeTab: string; onTabChange: (id: string) => void }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-[#2C302E] font-sans">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E8E6E1] transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#E8E6E1]">
          <h1 className="text-xl font-semibold tracking-tight text-[#7C9082]">ZenSpa Admin</h1>
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  isActive
                    ? "bg-[#7C9082] text-white"
                    : "text-gray-600 hover:bg-[#F4F1EB] hover:text-[#2C302E]"
                )}
              >
                <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "text-gray-400")} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-[#E8E6E1]">
          <button
            className="p-2 -ml-2 text-gray-500 md:hidden hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-4 ml-auto">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#D4C5B9] flex items-center justify-center text-white font-medium">
                A
              </div>
              <span className="text-sm font-medium hidden md:block">Admin</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
