import { Capacitor } from '@capacitor/core';

export function isNativeAndroidApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function resolveApiUrl(path: string, backendUrl?: string | null): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const trimmed = (backendUrl || '').trim().replace(/\/+$/, '');
  if (trimmed) {
    return `${trimmed}${cleanPath}`;
  }
  if (Capacitor.isNativePlatform()) {
    throw new Error(
      'AI analysis in the standalone Android APK requires a deployed TRACE backend URL. Open Settings > Backend Server URL to configure it.'
    );
  }
  return cleanPath;
}
