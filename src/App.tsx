import React, { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AddResearchScreen } from './screens/AddResearchScreen';
import { ConnectDesignScreen } from './screens/ConnectDesignScreen';
import { FinalTraceScreen } from './screens/FinalTraceScreen';
import { HomeScreen } from './screens/HomeScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import {
  clearAllLocalData,
  createEmptyProject,
  deleteProjectById,
  getActiveProjectId,
  getAllProjects,
  getAppSettings,
  getUserProfile,
  saveActiveProjectId,
  saveAppSettings,
  saveProject,
  saveUserProfile,
} from './storage/traceDb';
import {
  AppSettings,
  InsightItem,
  Project,
  ScreenRoute,
  TraceAnalysisResult,
  UserProfile,
} from './types/trace';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [route, setRoute] = useState<ScreenRoute>('welcome');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'UX Researcher',
    role: 'Product Designer',
    workspace: 'Personal Workspace',
  });
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    figmaAccessToken: null,
    figmaWorkspaceLabel: null,
    hasSeenWelcome: false,
  });

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      try {
        const [storedProjects, storedProfile, storedSettings, storedActiveId] = await Promise.all([
          getAllProjects(),
          getUserProfile(),
          getAppSettings(),
          getActiveProjectId(),
        ]);
        if (!mounted) return;
        setProjects(storedProjects);
        setProfile(storedProfile);
        setSettings(storedSettings);
        setActiveProjectId(storedActiveId);
        if (storedSettings.hasSeenWelcome) {
          setRoute('home');
        }
      } finally {
        if (mounted) setLoaded(true);
      }
    }
    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  const persistSettings = (next: AppSettings) => {
    setSettings(next);
    void saveAppSettings(next);
  };

  const persistProfile = (next: UserProfile) => {
    setProfile(next);
    void saveUserProfile(next);
  };

  const upsertProject = (updated: Project) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      const next = exists
        ? prev.map((p) => (p.id === updated.id ? updated : p))
        : [updated, ...prev];
      return [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    });
    void saveProject(updated);
  };

  const ensureActiveProject = (): Project => {
    if (activeProject) return activeProject;
    const created = createEmptyProject(`Project ${projects.length + 1}`);
    upsertProject(created);
    setActiveProjectId(created.id);
    void saveActiveProjectId(created.id);
    return created;
  };

  const handleCreateProject = (name: string) => {
    const created = createEmptyProject(name);
    upsertProject(created);
    setActiveProjectId(created.id);
    void saveActiveProjectId(created.id);
    setRoute('add-research');
  };

  const handleOpenProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    setActiveProjectId(target.id);
    void saveActiveProjectId(target.id);

    if (target.traceResult) {
      setRoute('final-trace');
    } else if (target.designScreens.length > 0) {
      setRoute('connect-design');
    } else if (target.insights.length > 0) {
      setRoute('insights');
    } else {
      setRoute('add-research');
    }
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    upsertProject({ ...target, name: newName, updatedAt: Date.now() });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    void deleteProjectById(projectId);
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      void saveActiveProjectId(null);
    }
  };

  const handleClearAllData = () => {
    void clearAllLocalData().then(() => {
      setProjects([]);
      setActiveProjectId(null);
      setSettings({
        notificationsEnabled: true,
        figmaAccessToken: null,
        figmaWorkspaceLabel: null,
        hasSeenWelcome: true,
      });
      setProfile({
        name: 'UX Researcher',
        role: 'Product Designer',
        workspace: 'Personal Workspace',
      });
    });
  };

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#EDE9FE] border-t-[#6C3BF5]" />
      </div>
    );
  }

  const showBottomNav = route === 'home' || route === 'projects' || route === 'settings';

  return (
    <>
      {route === 'welcome' && (
        <WelcomeScreen
          onGetStarted={() => {
            persistSettings({ ...settings, hasSeenWelcome: true });
            setRoute('home');
          }}
        />
      )}

      {route === 'home' && (
        <HomeScreen
          userName={profile.name}
          projects={projects}
          onStartResearch={() => {
            ensureActiveProject();
            setRoute('add-research');
          }}
          onStartDesign={() => {
            ensureActiveProject();
            setRoute('connect-design');
          }}
          onOpenProject={handleOpenProject}
          onCreateProject={() => setRoute('projects')}
          onNavigate={setRoute}
        />
      )}

      {route === 'projects' && (
        <ProjectsScreen
          userName={profile.name}
          projects={projects}
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          onNavigate={setRoute}
        />
      )}

      {route === 'add-research' && activeProject && (
        <AddResearchScreen
          userName={profile.name}
          project={activeProject}
          backendUrl={settings.backendUrl}
          onBack={() => setRoute('home')}
          onOpenSettings={() => setRoute('settings')}
          onUpdateProject={upsertProject}
          onInsightsGenerated={(insights: InsightItem[]) => {
            upsertProject({
              ...activeProject,
              insights,
              updatedAt: Date.now(),
            });
            setRoute('insights');
          }}
          onGoToInsights={() => setRoute('insights')}
        />
      )}

      {route === 'insights' && activeProject && (
        <InsightsScreen
          userName={profile.name}
          project={activeProject}
          onBack={() => setRoute('add-research')}
          onOpenSettings={() => setRoute('settings')}
          onUpdateInsights={(insights: InsightItem[]) =>
            upsertProject({
              ...activeProject,
              insights,
              updatedAt: Date.now(),
            })
          }
          onContinueToDesign={() => setRoute('connect-design')}
        />
      )}

      {route === 'connect-design' && activeProject && (
        <ConnectDesignScreen
          userName={profile.name}
          project={activeProject}
          settings={settings}
          onBack={() =>
            setRoute(activeProject.insights.length > 0 ? 'insights' : 'home')
          }
          onOpenSettings={() => setRoute('settings')}
          onUpdateProject={upsertProject}
          onUpdateSettings={persistSettings}
          onTraceCompleted={(result: TraceAnalysisResult) => {
            upsertProject({
              ...activeProject,
              traceResult: result,
              updatedAt: Date.now(),
            });
            setRoute('final-trace');
          }}
          onGoToTrace={() => setRoute('final-trace')}
        />
      )}

      {route === 'final-trace' && activeProject && (
        <FinalTraceScreen
          userName={profile.name}
          project={activeProject}
          onBack={() => setRoute('connect-design')}
          onOpenSettings={() => setRoute('settings')}
          onUpdateTrace={(traceResult: TraceAnalysisResult) =>
            upsertProject({
              ...activeProject,
              traceResult,
              updatedAt: Date.now(),
            })
          }
          onReturnHome={() => setRoute('home')}
        />
      )}

      {route === 'settings' && (
        <SettingsScreen
          profile={profile}
          settings={settings}
          onUpdateProfile={persistProfile}
          onUpdateSettings={persistSettings}
          onClearAllData={handleClearAllData}
          onLogOut={() => {
            persistSettings({ ...settings, hasSeenWelcome: false });
            setRoute('welcome');
          }}
        />
      )}

      {showBottomNav && <BottomNav currentRoute={route} onNavigate={setRoute} />}
      <OfflineIndicator />
    </>
  );
}
