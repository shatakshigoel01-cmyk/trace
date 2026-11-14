import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'row' }> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    if (variant === 'row') {
      return (
        <button
          type="button"
          onClick={install}
          className="flex w-full items-center justify-between rounded-2xl border border-[#EAECEF] bg-white px-4 py-3.5 text-left transition hover:bg-[#F8F9FC]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EEFF] text-[#6C3BF5]">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#11131C]">Install TRACE App</p>
              <p className="text-xs text-[#646A7A]">Add to home screen for offline access</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#6C3BF5]">Install</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#F3EEFF] px-3 py-1.5 text-xs font-semibold text-[#6C3BF5] transition hover:bg-[#E7DDFE] whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#E2E5EC] bg-white px-3 py-1.5 text-xs font-medium text-[#3E4352] transition hover:bg-[#F5F6FA] whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5 text-[#6C3BF5]" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl">
              <h3 className="font-display text-lg font-semibold text-[#11131C]">
                Install TRACE on iPhone / iPad
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#525866]">
                1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                <br />
                2. Scroll down and select <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-full bg-[#6C3BF5] py-3 text-sm font-semibold text-white transition hover:bg-[#5B2BE0]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
