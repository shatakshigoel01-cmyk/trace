import React, { useState } from 'react';
import { ChevronRight, FolderOpen, Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { Project, ScreenRoute } from '../types/trace';

interface ProjectsScreenProps {
  userName: string;
  projects: Project[];
  onCreateProject: (name: string) => void;
  onOpenProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onNavigate: (route: ScreenRoute) => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  userName,
  projects,
  onCreateProject,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
  onNavigate,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateProject(trimmed);
    setNewName('');
    setShowNewModal(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingProject || !renameValue.trim()) return;
    onRenameProject(renamingProject.id, renameValue.trim());
    setRenamingProject(null);
    setRenameValue('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] pb-24">
      <TopBar
        subtitle="Projects"
        userName={userName}
        onOpenSettings={() => onNavigate('settings')}
      />

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#11131C]">
              My Projects
            </h1>
            <span className="font-mono text-sm text-[#646A7A]">{projects.length}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-[#6C3BF5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5B2BE0] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-[#EAECEF] bg-white px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EEFF] text-[#6C3BF5]">
              <FolderOpen className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold text-[#11131C]">
              No projects created yet
            </h2>
            <p className="mt-1.5 max-w-xs text-sm text-[#525866]">
              Start a new project to upload research files, review AI insights, and trace UI screens.
            </p>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#6C3BF5] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5B2BE0]"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Project</span>
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#EAECEF] bg-white p-4 transition hover:border-[#D6C9FF]"
              >
                <button
                  type="button"
                  onClick={() => onOpenProject(project.id)}
                  className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3EEFF] text-[#6C3BF5]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-semibold text-[#11131C]">
                      {project.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#646A7A]">
                      Edited {new Date(project.updatedAt).toLocaleDateString()} · {project.researchFiles.length} files · {project.designScreens.length} screens
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label={`Rename ${project.name}`}
                    onClick={() => {
                      setRenamingProject(project);
                      setRenameValue(project.name);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#646A7A] transition hover:bg-[#F3F4F8] hover:text-[#11131C]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${project.name}`}
                    onClick={() => setDeletingProject(project)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#646A7A] transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Open ${project.name}`}
                    onClick={() => onOpenProject(project.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#646A7A] transition hover:bg-[#F3EEFF] hover:text-[#6C3BF5]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#11131C]">
                New Project
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#646A7A] hover:bg-[#F3F4F8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-4 block text-xs font-medium text-[#525866]">
              Project Name
              <input
                type="text"
                autoFocus
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Checkout Flow Redesign"
                className="mt-1.5 w-full rounded-xl border border-[#DCE0E8] px-3.5 py-2.5 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="min-h-[42px] rounded-full px-4 py-2 text-sm font-medium text-[#525866] hover:bg-[#F3F4F8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5B2BE0]"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {renamingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRenameSubmit}
            className="w-full max-w-md rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl"
          >
            <h2 className="font-display text-lg font-semibold text-[#11131C]">
              Rename Project
            </h2>
            <input
              type="text"
              autoFocus
              required
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="mt-4 w-full rounded-xl border border-[#DCE0E8] px-3.5 py-2.5 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
            />
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRenamingProject(null)}
                className="min-h-[42px] rounded-full px-4 py-2 text-sm font-medium text-[#525866] hover:bg-[#F3F4F8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5B2BE0]"
              >
                Save Name
              </button>
            </div>
          </form>
        </div>
      )}

      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-[#11131C]">
              Delete Project?
            </h2>
            <p className="mt-2 text-sm text-[#525866]">
              This will permanently remove <strong>{deletingProject.name}</strong> and its local files, insights, and traces.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="min-h-[42px] rounded-full px-4 py-2 text-sm font-medium text-[#525866] hover:bg-[#F3F4F8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProject(deletingProject.id);
                  setDeletingProject(null);
                }}
                className="min-h-[42px] rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
