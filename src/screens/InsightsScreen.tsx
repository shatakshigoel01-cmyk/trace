import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Link2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { InsightCategory, InsightItem, Project } from '../types/trace';

interface InsightsScreenProps {
  userName: string;
  project: Project;
  onBack: () => void;
  onOpenSettings: () => void;
  onUpdateInsights: (insights: InsightItem[]) => void;
  onContinueToDesign: () => void;
}

const CATEGORY_LABELS: Record<InsightCategory, { title: string; subtitle: string; color: string }> = {
  key_finding: { title: 'Key Findings', subtitle: 'Primary Insights', color: 'text-[#6C3BF5]' },
  user_need: { title: 'User Needs', subtitle: 'Opportunities', color: 'text-[#2563EB]' },
  common_pattern: { title: 'Common Patterns', subtitle: 'Recurring Behavior', color: 'text-[#6C3BF5]' },
  research_gap: { title: 'Research Gaps', subtitle: 'Missing Evidence', color: 'text-[#525866]' },
};

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  userName,
  project,
  onBack,
  onOpenSettings,
  onUpdateInsights,
  onContinueToDesign,
}) => {
  const [filter, setFilter] = useState<'all' | InsightCategory>('all');
  const [editingItem, setEditingItem] = useState<InsightItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  const counts: Record<'all' | InsightCategory, number> = {
    all: project.insights.length,
    key_finding: project.insights.filter((i) => i.category === 'key_finding').length,
    user_need: project.insights.filter((i) => i.category === 'user_need').length,
    common_pattern: project.insights.filter((i) => i.category === 'common_pattern').length,
    research_gap: project.insights.filter((i) => i.category === 'research_gap').length,
  };

  const categoriesToRender: InsightCategory[] =
    filter === 'all'
      ? ['key_finding', 'user_need', 'common_pattern', 'research_gap']
      : [filter];

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    if (isNewItem) {
      onUpdateInsights([...project.insights, editingItem]);
    } else {
      onUpdateInsights(
        project.insights.map((item) => (item.id === editingItem.id ? editingItem : item))
      );
    }
    setEditingItem(null);
    setIsNewItem(false);
  };

  const handleDelete = (id: string) => {
    onUpdateInsights(project.insights.filter((item) => item.id !== id));
  };

  const openAddCustom = () => {
    setIsNewItem(true);
    setEditingItem({
      id: `custom_${Date.now()}`,
      category: filter === 'all' ? 'key_finding' : filter,
      tag: 'Custom Insight',
      title: '',
      evidence: '',
      sourceName: 'Researcher Note',
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] pb-28">
      <TopBar
        subtitle={project.name}
        onBack={onBack}
        userName={userName}
        onOpenSettings={onOpenSettings}
      />

      <main className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-[#646A7A]">
          <span className="font-semibold text-[#6C3BF5]">Step 2 of 4</span>
          <span aria-hidden="true">·</span>
          <span>Synthesized Findings</span>
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#11131C]">
              Research Insights
            </h1>
            <p className="mt-1 text-sm text-[#525866]">
              Grounded findings extracted from your uploaded artifacts and notes.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[#6C3BF5] whitespace-nowrap shrink-0">
            {project.insights.length} findings
          </span>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {(
            [
              { id: 'all', label: `All Findings (${counts.all})` },
              { id: 'key_finding', label: `Key Findings (${counts.key_finding})` },
              { id: 'user_need', label: `User Needs (${counts.user_need})` },
              { id: 'common_pattern', label: `Common Patterns (${counts.common_pattern})` },
              { id: 'research_gap', label: `Research Gaps (${counts.research_gap})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-[#6C3BF5] text-white shadow-xs'
                  : 'border border-[#E2E5EC] bg-white text-[#525866] hover:bg-[#F5F6FA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {project.insights.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-[#EAECEF] bg-white p-8 text-center">
            <h2 className="font-display text-base font-semibold text-[#11131C]">
              No insights saved yet
            </h2>
            <p className="mt-1.5 text-sm text-[#525866]">
              Go back to analyse uploaded research, or add a custom insight below.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-7">
            {categoriesToRender.map((cat) => {
              const items = project.insights.filter((i) => i.category === cat);
              if (items.length === 0) return null;
              const meta = CATEGORY_LABELS[cat];

              return (
                <section key={cat}>
                  <div className="flex items-baseline justify-between mb-3">
                    <h2 className="font-display text-base font-semibold text-[#11131C]">
                      {meta.title}
                    </h2>
                    <span className="text-xs text-[#646A7A]">{meta.subtitle}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className="flex flex-col justify-between rounded-2xl border border-[#EAECEF] bg-white p-4"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-semibold ${meta.color}`}>
                              {item.tag}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label="Edit insight"
                                onClick={() => {
                                  setIsNewItem(false);
                                  setEditingItem({ ...item });
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#646A7A] hover:bg-[#F3EEFF] hover:text-[#6C3BF5]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label="Delete insight"
                                onClick={() => handleDelete(item.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#646A7A] hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="mt-2 text-sm font-medium leading-relaxed text-[#11131C]">
                            {item.title}
                          </p>
                        </div>

                        <div className="mt-3 rounded-xl bg-[#F5F7FC] p-3">
                          <p className="text-xs leading-relaxed text-[#3E4352]">
                            &ldquo;{item.evidence}&rdquo;
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#646A7A]">
                            <Link2 className="h-3.5 w-3.5 text-[#6C3BF5]" />
                            <span className="truncate">Source: {item.sourceName}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={openAddCustom}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#DDD6FE] bg-[#F6F4FF] px-5 py-2.5 text-sm font-semibold text-[#6C3BF5] transition hover:bg-[#EDE9FE]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Insight</span>
          </button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#EAECEF] bg-white/95 px-4 py-3 backdrop-blur-md pb-safe">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Research"
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border border-[#DCE0E8] bg-white text-[#11131C] hover:bg-[#F5F6FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onContinueToDesign}
            className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-full bg-[#6C3BF5] px-6 py-3 text-base font-semibold text-white shadow-md shadow-[#6C3BF5]/20 transition hover:bg-[#5B2BE0]"
          >
            <span>Continue to Design</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#11131C]">
                {isNewItem ? 'Add Custom Insight' : 'Edit Insight'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsNewItem(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#646A7A] hover:bg-[#F3F4F8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-[#525866]">
                  Category
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value as InsightCategory,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-[#DCE0E8] bg-white px-3 py-2 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                  >
                    <option value="key_finding">Key Finding</option>
                    <option value="user_need">User Need</option>
                    <option value="common_pattern">Common Pattern</option>
                    <option value="research_gap">Research Gap</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-[#525866]">
                  Theme Label
                  <input
                    type="text"
                    required
                    value={editingItem.tag}
                    onChange={(e) => setEditingItem({ ...editingItem, tag: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#DCE0E8] px-3 py-2 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-[#525866]">
                Insight Statement
                <textarea
                  rows={2}
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="Describe the finding clearly..."
                  className="mt-1 w-full rounded-xl border border-[#DCE0E8] p-3 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>

              <label className="block text-xs font-medium text-[#525866]">
                Supporting Evidence / Quote
                <textarea
                  rows={2}
                  required
                  value={editingItem.evidence}
                  onChange={(e) => setEditingItem({ ...editingItem, evidence: e.target.value })}
                  placeholder="Quote or factual evidence from your research..."
                  className="mt-1 w-full rounded-xl border border-[#DCE0E8] p-3 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>

              <label className="block text-xs font-medium text-[#525866]">
                Source File or Note
                <input
                  type="text"
                  required
                  value={editingItem.sourceName}
                  onChange={(e) => setEditingItem({ ...editingItem, sourceName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#DCE0E8] px-3 py-2 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsNewItem(false);
                }}
                className="min-h-[42px] rounded-full px-4 py-2 text-sm font-medium text-[#525866] hover:bg-[#F3F4F8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5B2BE0]"
              >
                Save Insight
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
