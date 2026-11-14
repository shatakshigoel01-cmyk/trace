import React from 'react';
import { FolderOpen, Home, SlidersHorizontal } from 'lucide-react';
import { ScreenRoute } from '../types/trace';

interface BottomNavProps {
  currentRoute: ScreenRoute;
  onNavigate: (route: ScreenRoute) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const items: Array<{ id: ScreenRoute; label: string; icon: React.ReactNode }> = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="h-5 w-5" />,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderOpen className="h-5 w-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SlidersHorizontal className="h-5 w-5" />,
    },
  ];

  return (
    <nav
      aria-label="Primary Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#EAECEF] bg-white/95 backdrop-blur-md pb-safe"
    >
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-3 items-center px-4">
        {items.map((item) => {
          const active = currentRoute === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 transition"
            >
              <span
                className={`flex items-center justify-center rounded-2xl px-4 py-1 transition-colors ${
                  active
                    ? 'bg-[#F3EEFF] text-[#6C3BF5]'
                    : 'text-[#646A7A] hover:text-[#11131C]'
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  active ? 'text-[#6C3BF5] font-semibold' : 'text-[#646A7A]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
