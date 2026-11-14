import React from 'react';
import { ArrowRight, ChevronRight, FolderOpen, Layers, Mic, Plus } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { Project, ScreenRoute } from '../types/trace';

interface HomeScreenProps {
  userName: string;
  projects: Project[];
  onStartResearch: () => void;
  onStartDesign: () => void;
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
  onNavigate: (route: ScreenRoute) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName,
  projects,
  onStartResearch,
  onStartDesign,
  onOpenProject,
  onCreateProject,
  onNavigate,
}) => {
  const recentProjects = projects.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F9FAFC] pb-24">
      <TopBar
        subtitle="Home"
        userName={userName}
        onOpenSettings={() => onNavigate('settings')}
      />

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <p className="text-xs font-semibold tracking-wider text-[#6C3BF5] uppercase">
          Workspace Focus
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#11131C] sm:text-3xl text-balance">
          What would you like to work on?
        </h1>
        <p className="mt-1.5 text-sm text-[#525866]">
          Upload research artifacts or connect UI screens to trace design decisions.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={onStartResearch}
            className="group flex flex-col justify-between rounded-3xl border border-[#EAECEF] bg-white p-5 text-left shadow-xs transition hover:border-[#D6C9FF] hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EEFF] text-[#6C3BF5]">
                <Mic className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold text-[#11131C]">
                    Add Research
                  </h2>
                  <span className="text-xs font-medium text-[#6C3BF5]">
                    Files · Notes
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#525866]">
                  Upload PDFs, transcripts, spreadsheets, or field notes to extract grounded UX insights.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 pl-16 text-sm font-semibold text-[#6C3BF5]">
              <span>Import insights</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={onStartDesign}
            className="group flex flex-col justify-between rounded-3xl border border-[#EAECEF] bg-white p-5 text-left shadow-xs transition hover:border-[#C7DBFF] hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                <Layers className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold text-[#11131C]">
                    Connect Design
                  </h2>
                  <span className="text-xs font-medium text-[#2563EB]">
                    Figma · Screens
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#525866]">
                  Link a Figma file or upload UI screenshots to correlate screens with research findings.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 pl-16 text-sm font-semibold text-[#2563EB]">
              <span>Link prototype</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-[#11131C]">
                Recent Projects
              </h2>
              <span className="font-mono text-xs text-[#646A7A]">
                ({projects.length})
              </span>
            </div>
            {projects.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className="text-xs font-semibold text-[#6C3BF5] hover:underline"
              >
                View all
              </button>
            )}
          </div>

          {recentProjects.length === 0 ? (
            <div className="mt-3 flex flex-col items-center rounded-3xl border border-[#EAECEF] bg-white px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EEFF] text-[#6C3BF5]">
                <FolderOpen className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-[#11131C]">
                No projects yet
              </h3>
              <p className="mt-1 max-w-xs text-sm text-[#525866]">
                Create a project or choose an option above to begin tracing design decisions.
              </p>
              <button
                type="button"
                onClick={onCreateProject}
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#E2E5EC] bg-white px-5 py-2.5 text-sm font-semibold text-[#11131C] transition hover:bg-[#F5F6FA]"
              >
                <Plus className="h-4 w-4 text-[#6C3BF5]" />
                <span>Create Project</span>
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onOpenProject(project.id)}
                  className="flex min-h-[68px] items-center justify-between gap-3 rounded-2xl border border-[#EAECEF] bg-white p-4 text-left transition hover:border-[#D6C9FF] hover:shadow-xs"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3EEFF] text-[#6C3BF5]">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-[#11131C]">
                        {project.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#646A7A]">
                        Edited {new Date(project.updatedAt).toLocaleDateString()} · {project.insights.length} insights · {project.designScreens.length} screens
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#8A90A0]" />
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
