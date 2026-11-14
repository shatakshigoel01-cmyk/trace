import React, { useState } from 'react';
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Network,
  User,
  X,
} from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { TopBar } from '../components/TopBar';
import { AppSettings, UserProfile } from '../types/trace';
import { isNativeAndroidApp } from '../utils/apiClient';

interface SettingsScreenProps {
  profile: UserProfile;
  settings: AppSettings;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onClearAllData: () => void;
  onLogOut: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onClearAllData,
  onLogOut,
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);
  const [showFigmaModal, setShowFigmaModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: draftProfile.name.trim() || 'UX Researcher',
      role: draftProfile.role.trim() || 'Product Designer',
      workspace: draftProfile.workspace.trim() || 'Personal Workspace',
    });
    setShowProfileModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] pb-24">
      <TopBar
        subtitle="Settings"
        userName={profile.name}
        onOpenSettings={() => undefined}
      />

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <p className="text-xs font-semibold tracking-wider text-[#6C3BF5] uppercase">
          Preferences
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#11131C]">
          Settings
        </h1>

        <section className="mt-6">
          <h2 className="px-1 text-xs font-semibold tracking-wider text-[#646A7A] uppercase">
            Account &amp; Workspace
          </h2>
          <div className="mt-2 divide-y divide-[#F1F3F7] overflow-hidden rounded-3xl border border-[#EAECEF] bg-white">
            <button
              type="button"
              onClick={() => {
                setDraftProfile(profile);
                setShowProfileModal(true);
              }}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-[#F9FAFC]"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EEFF] text-[#6C3BF5]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#11131C]">Edit Profile</p>
                  <p className="text-xs text-[#646A7A]">
                    {profile.name} · {profile.role}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#8A90A0]" />
            </button>

            <button
              type="button"
              onClick={() => setShowFigmaModal(true)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-[#F9FAFC]"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EEFF] text-[#6C3BF5]">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#11131C]">Connected Figma Account</p>
                  <p className="text-xs text-[#646A7A]">
                    {settings.figmaAccessToken ? 'Connected via OAuth' : 'Not connected'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#8A90A0]" />
            </button>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-xs font-semibold tracking-wider text-[#646A7A] uppercase">
            System &amp; Experience
          </h2>
          <div className="mt-2 divide-y divide-[#F1F3F7] overflow-hidden rounded-3xl border border-[#EAECEF] bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EEFF] text-[#6C3BF5]">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#11131C]">Notifications</p>
                  <p className="text-xs text-[#646A7A]">Research analysis completion alerts</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.notificationsEnabled}
                aria-label="Toggle notifications"
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    notificationsEnabled: !settings.notificationsEnabled,
                  })
                }
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  settings.notificationsEnabled ? 'bg-[#6C3BF5]' : 'bg-[#D6DAE4]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-[#F9FAFC]"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EEFF] text-[#6C3BF5]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#11131C]">Privacy</p>
                  <p className="text-xs text-[#646A7A]">Local storage &amp; AI processing policy</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#8A90A0]" />
            </button>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-[#F9FAFC]"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EEFF] text-[#6C3BF5]">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#11131C]">Help &amp; Support</p>
                  <p className="text-xs text-[#646A7A]">Workflow guide &amp; supported formats</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#8A90A0]" />
            </button>
          </div>
        </section>

        <div className="mt-4">
          <PWAInstallButton variant="row" />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-[#EAECEF] bg-white">
          <button
            type="button"
            onClick={onLogOut}
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-red-50/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-600">Log Out</p>
                <p className="text-xs text-[#646A7A]">Return to welcome screen</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </main>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-md rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#11131C]">Edit Profile</h2>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#646A7A] hover:bg-[#F3F4F8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-[#525866]">
                Full Name
                <input
                  type="text"
                  required
                  value={draftProfile.name}
                  onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#DCE0E8] px-3.5 py-2.5 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>
              <label className="block text-xs font-medium text-[#525866]">
                Role
                <input
                  type="text"
                  required
                  value={draftProfile.role}
                  onChange={(e) => setDraftProfile({ ...draftProfile, role: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#DCE0E8] px-3.5 py-2.5 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>
              <label className="block text-xs font-medium text-[#525866]">
                Workspace
                <input
                  type="text"
                  value={draftProfile.workspace}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, workspace: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DCE0E8] px-3.5 py-2.5 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="min-h-[42px] rounded-full px-4 py-2 text-sm font-medium text-[#525866]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {showFigmaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-[#11131C]">
              Connected Figma Account
            </h2>
            <p className="mt-2 text-sm text-[#525866]">
              {settings.figmaAccessToken
                ? 'Your Figma OAuth session is active in this browser.'
                : 'No Figma account is connected. Configure FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET on the server to enable Figma OAuth, or upload UI screenshots directly inside Connect Design.'}
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              {settings.figmaAccessToken && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings({
                      ...settings,
                      figmaAccessToken: null,
                      figmaWorkspaceLabel: null,
                    });
                    setShowFigmaModal(false);
                  }}
                  className="min-h-[42px] rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
                >
                  Disconnect
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFigmaModal(false)}
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-[#11131C]">Privacy &amp; Data</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#525866]">
              Your projects, uploaded research documents, notes, and UI screenshots are stored locally on your device in IndexedDB so they remain available across restarts. Files are only sent to the TRACE AI backend when you explicitly tap Analyse Research or Analyse &amp; Connect.
            </p>
            {isNativeAndroidApp() && (
              <label className="mt-4 block text-xs font-semibold text-[#3E4352]">
                TRACE Backend Server URL (for AI Analysis)
                <input
                  type="url"
                  value={settings.backendUrl || ''}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, backendUrl: e.target.value })
                  }
                  placeholder="https://your-trace-server.run.app"
                  className="mt-1.5 w-full rounded-xl border border-[#DCE0E8] px-3.5 py-2.5 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>
            )}
            <div className="mt-6 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setShowPrivacyModal(false);
                }}
                className="min-h-[42px] rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Clear Local Data
              </button>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-[#11131C]">Help &amp; Support</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-[#525866]">
              <li>Create a project or choose Add Research on Home.</li>
              <li>Upload PDF, DOCX, PPTX, XLSX, CSV, TXT, images, or add manual notes.</li>
              <li>Run AI Research Analysis and review, edit, or add insights.</li>
              <li>Upload PNG/JPG/WEBP UI screenshots or connect Figma frames.</li>
              <li>Run Trace Analysis to view evidence-to-decision chains and export PDF.</li>
            </ol>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
