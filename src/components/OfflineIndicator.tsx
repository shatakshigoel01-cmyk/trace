import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#11131C] px-4 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
      <span>Offline — local projects remain saved</span>
    </div>
  );
};
