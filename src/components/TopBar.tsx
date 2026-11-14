import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { TraceLogo } from './TraceLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  subtitle: string;
  onBack?: () => void;
  userName: string;
  onOpenSettings: () => void;
  rightSlot?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  subtitle,
  onBack,
  userName,
  onOpenSettings,
  rightSlot,
}) => {
  const initials =
    userName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';

  return (
    <header className="sticky top-0 z-30 border-b border-[#EEF0F4] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="flex h-10 w-10 -ml-2 items-center justify-center rounded-full text-[#11131C] transition hover:bg-[#F3F4F8]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <TraceLogo size="sm" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-wider text-[#6C3BF5] uppercase leading-none">
              TRACE
            </p>
            <p className="truncate text-sm font-semibold text-[#11131C] mt-0.5 leading-tight">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="compact" />
          {rightSlot}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDE9FE] text-xs font-bold text-[#5B21B6] border border-[#DDD6FE] transition hover:bg-[#E2DAFC]"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
};
