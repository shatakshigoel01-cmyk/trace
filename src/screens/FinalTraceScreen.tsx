import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileEdit,
  X,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import {
  Project,
  TraceAnalysisResult,
  TraceMatch,
  UnmatchedInsight,
  UnsupportedDecision,
} from '../types/trace';
import { exportTracePdf } from '../utils/pdfExport';

interface FinalTraceScreenProps {
  userName: string;
  project: Project;
  onBack: () => void;
  onOpenSettings: () => void;
  onUpdateTrace: (trace: TraceAnalysisResult) => void;
  onReturnHome: () => void;
}

export const FinalTraceScreen: React.FC<FinalTraceScreenProps> = ({
  userName,
  project,
  onBack,
  onOpenSettings,
  onUpdateTrace,
  onReturnHome,
}) => {
  const trace = project.traceResult;
  const [filter, setFilter] = useState<'all' | 'supported' | 'gaps'>('all');
  const [editingTrace, setEditingTrace] = useState<TraceMatch | null>(null);
  const [editingUnsupported, setEditingUnsupported] = useState<UnsupportedDecision | null>(null);
  const [editingUnmatched, setEditingUnmatched] = useState<UnmatchedInsight | null>(null);

  if (!trace) {
    return (
      <div className="min-h-screen bg-[#F9FAFC]">
        <TopBar
          subtitle={project.name}
          onBack={onBack}
          userName={userName}
          onOpenSettings={onOpenSettings}
        />
        <main className="mx-auto max-w-5xl px-4 py-12 text-center">
          <p className="text-sm text-[#525866]">No trace analysis generated yet.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 rounded-full bg-[#6C3BF5] px-6 py-2.5 text-sm font-semibold text-white"
          >
            Back to Connect Design
          </button>
        </main>
      </div>
    );
  }

  const supportedCount = trace.supportedTraces.length;
  const gapsCount = trace.unsupportedDecisions.length + trace.unmatchedInsights.length;

  const findScreenPreview = (screenId: string, screenName: string) => {
    return (
      project.designScreens.find((s) => s.id === screenId) ||
      project.designScreens.find(
        (s) => s.name.toLowerCase().trim() === screenName.toLowerCase().trim()
      )
    );
  };

  const toggleConfirmTrace = (id: string) => {
    onUpdateTrace({
      ...trace,
      supportedTraces: trace.supportedTraces.map((item) =>
        item.id === id ? { ...item, confirmed: !item.confirmed } : item
      ),
    });
  };

  const toggleReviewUnsupported = (id: string) => {
    onUpdateTrace({
      ...trace,
      unsupportedDecisions: trace.unsupportedDecisions.map((item) =>
        item.id === id ? { ...item, reviewed: !item.reviewed } : item
      ),
    });
  };

  const saveTraceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrace) return;
    onUpdateTrace({
      ...trace,
      supportedTraces: trace.supportedTraces.map((t) =>
        t.id === editingTrace.id ? editingTrace : t
      ),
    });
    setEditingTrace(null);
  };

  const saveUnsupportedEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnsupported) return;
    onUpdateTrace({
      ...trace,
      unsupportedDecisions: trace.unsupportedDecisions.map((u) =>
        u.id === editingUnsupported.id ? editingUnsupported : u
      ),
    });
    setEditingUnsupported(null);
  };

  const saveUnmatchedEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnmatched) return;
    onUpdateTrace({
      ...trace,
      unmatchedInsights: trace.unmatchedInsights.map((m) =>
        m.id === editingUnmatched.id ? editingUnmatched : m
      ),
    });
    setEditingUnmatched(null);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] pb-16">
      <TopBar
        subtitle={project.name}
        onBack={onBack}
        userName={userName}
        onOpenSettings={onOpenSettings}
      />

      <main className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-[#646A7A]">
          <span className="font-semibold text-[#6C3BF5]">Step 4 of 4</span>
          <span aria-hidden="true">·</span>
          <span>Decision Trace</span>
        </div>

        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#11131C]">
          Trace Analysis
        </h1>
        <p className="mt-1 text-sm text-[#525866]">
          Correlating research evidence with UI execution
        </p>

        {/* Filter Bar + Export PDF */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                filter === 'all'
                  ? 'bg-[#6C3BF5] text-white'
                  : 'border border-[#E2E5EC] bg-white text-[#525866]'
              }`}
            >
              All Traces ({supportedCount + gapsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('supported')}
              className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                filter === 'supported'
                  ? 'bg-[#6C3BF5] text-white'
                  : 'border border-[#E2E5EC] bg-white text-[#525866]'
              }`}
            >
              Supported ({supportedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('gaps')}
              className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                filter === 'gaps'
                  ? 'bg-[#6C3BF5] text-white'
                  : 'border border-[#E2E5EC] bg-white text-[#525866]'
              }`}
            >
              Gaps ({gapsCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => exportTracePdf(project)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export PDF</span>
          </button>
        </div>

        {/* Supported Design Decisions */}
        {(filter === 'all' || filter === 'supported') && (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#6C3BF5]" />
                <h2 className="font-display text-lg font-semibold text-[#11131C]">
                  Supported Design Decisions
                </h2>
              </div>
              <span className="font-mono text-xs font-semibold text-[#6C3BF5]">
                {supportedCount} verified
              </span>
            </div>

            {supportedCount === 0 ? (
              <div className="mt-3 rounded-2xl border border-[#EAECEF] bg-white p-6 text-center text-sm text-[#525866]">
                No direct research-to-screen matches were found. Check gaps below or upload additional screens.
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {trace.supportedTraces.map((item) => {
                  const preview = findScreenPreview(item.relatedScreenId, item.relatedScreenName);
                  return (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-[#EAECEF] bg-white p-5 shadow-xs"
                    >
                      <div className="flex items-start gap-3.5">
                        {preview ? (
                          <img
                            src={`data:${preview.mimeType};base64,${preview.dataBase64}`}
                            alt={item.relatedScreenName}
                            className="h-16 w-14 shrink-0 rounded-xl border border-[#EAECEF] object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F3EEFF] text-xs font-semibold text-[#6C3BF5]">
                            UI
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-[#6C3BF5] uppercase tracking-wide">
                              {item.confidenceLabel}
                            </span>
                          </div>
                          <h3 className="mt-0.5 font-display text-base font-semibold text-[#11131C] truncate">
                            {item.relatedScreenName}
                          </h3>
                        </div>
                      </div>

                      {/* Trace Chain: Evidence -> Key Insight -> Related Design Screen -> Design Decision */}
                      <div className="mt-4 space-y-2.5">
                        <div className="rounded-2xl bg-[#F5F7FC] p-3.5">
                          <p className="text-[11px] font-semibold tracking-wide text-[#6C3BF5] uppercase">
                            1. Research Evidence
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[#3E4352]">
                            &ldquo;{item.evidence}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 pl-2 text-xs font-semibold text-[#8A90A0]">
                          <ArrowRight className="h-3.5 w-3.5 text-[#6C3BF5]" />
                          <span>leads to</span>
                        </div>

                        <div className="rounded-2xl bg-[#F5F4FF] p-3.5">
                          <p className="text-[11px] font-semibold tracking-wide text-[#6C3BF5] uppercase">
                            2. Key Insight
                          </p>
                          <p className="mt-1 text-sm font-medium text-[#11131C]">
                            {item.keyInsight}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#EFF5FF] p-3.5">
                          <p className="text-[11px] font-semibold tracking-wide text-[#2563EB] uppercase">
                            3. Design Screen &amp; 4. Decision ({item.relatedScreenName})
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[#1E293B]">
                            {item.designDecision}
                          </p>
                        </div>

                        {item.annotatedNote && (
                          <div className="rounded-xl border border-[#EAECEF] bg-white px-3 py-2 text-xs text-[#525866]">
                            <span className="font-semibold text-[#11131C]">Note: </span>
                            {item.annotatedNote}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-[#F1F3F7]">
                        <button
                          type="button"
                          onClick={() => toggleConfirmTrace(item.id)}
                          className="inline-flex min-h-[38px] items-center gap-2 text-sm font-medium text-[#11131C]"
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                              item.confirmed
                                ? 'border-[#6C3BF5] bg-[#6C3BF5] text-white'
                                : 'border-[#CBD2DF] bg-white'
                            }`}
                          >
                            {item.confirmed && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span>Confirm AI Suggestion</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingTrace({ ...item })}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#E2E5EC] px-3.5 py-1.5 text-xs font-semibold text-[#3E4352] hover:bg-[#F5F6FA]"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Unmatched Insights & Unsupported Decisions */}
        {(filter === 'all' || filter === 'gaps') && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h2 className="font-display text-lg font-semibold text-[#11131C]">
                  Unmatched &amp; Unsupported Decisions
                </h2>
              </div>
              <span className="font-mono text-xs font-semibold text-red-600">
                {gapsCount} identified
              </span>
            </div>

            {gapsCount === 0 ? (
              <div className="mt-3 rounded-2xl border border-[#EAECEF] bg-white p-6 text-center text-sm text-[#525866]">
                All insights and design decisions are aligned.
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {trace.unsupportedDecisions.map((item) => {
                  const preview = findScreenPreview(item.screenId, item.screenName);
                  return (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-[#EAECEF] bg-white p-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-red-600">
                          Unsupported Design Decision
                        </span>
                        <span className="text-xs text-[#646A7A]">{item.screenName}</span>
                      </div>

                      <div className="mt-3 flex items-start gap-3">
                        {preview && (
                          <img
                            src={`data:${preview.mimeType};base64,${preview.dataBase64}`}
                            alt={item.screenName}
                            className="h-14 w-12 shrink-0 rounded-xl border border-[#EAECEF] object-cover"
                          />
                        )}
                        <p className="text-sm font-semibold text-[#11131C]">
                          {item.designDecision}
                        </p>
                      </div>

                      <div className="mt-3 rounded-2xl bg-[#FFF5F5] p-3.5">
                        <p className="text-[11px] font-semibold tracking-wide text-red-700 uppercase">
                          Evidence Gap
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#3E4352]">
                          {item.reason}
                        </p>
                      </div>

                      {item.annotatedNote && (
                        <div className="mt-2.5 rounded-xl border border-[#EAECEF] px-3 py-2 text-xs text-[#525866]">
                          <span className="font-semibold text-[#11131C]">Note: </span>
                          {item.annotatedNote}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-[#F1F3F7]">
                        <button
                          type="button"
                          onClick={() => toggleReviewUnsupported(item.id)}
                          className="inline-flex min-h-[38px] items-center gap-2 text-sm font-medium text-[#11131C]"
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                              item.reviewed
                                ? 'border-[#6C3BF5] bg-[#6C3BF5] text-white'
                                : 'border-[#CBD2DF] bg-white'
                            }`}
                          >
                            {item.reviewed && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span>Mark Reviewed</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingUnsupported({ ...item })}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#E2E5EC] px-3.5 py-1.5 text-xs font-semibold text-[#3E4352] hover:bg-[#F5F6FA]"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          <span>Annotate</span>
                        </button>
                      </div>
                    </article>
                  );
                })}

                {trace.unmatchedInsights.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-[#EAECEF] bg-white p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#2563EB]">
                        Unmatched Research Insight
                      </span>
                      <span className="text-xs text-[#646A7A] truncate max-w-[160px]">
                        {item.sourceName}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl bg-[#F4F7FE] p-3.5">
                      <p className="text-sm font-semibold text-[#11131C]">{item.keyInsight}</p>
                      <p className="mt-1.5 text-xs text-[#525866]">&ldquo;{item.evidence}&rdquo;</p>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[#3E4352]">{item.reason}</p>

                    {item.annotatedNote && (
                      <div className="mt-2.5 rounded-xl border border-[#EAECEF] px-3 py-2 text-xs text-[#525866]">
                        <span className="font-semibold text-[#11131C]">Note: </span>
                        {item.annotatedNote}
                      </div>
                    )}

                    <div className="mt-4 flex justify-end pt-2 border-t border-[#F1F3F7]">
                      <button
                        type="button"
                        onClick={() => setEditingUnmatched({ ...item })}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#E2E5EC] px-3.5 py-1.5 text-xs font-semibold text-[#3E4352] hover:bg-[#F5F6FA]"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                        <span>Annotate</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => exportTracePdf(project)}
            className="flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-full bg-[#6C3BF5] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#6C3BF5]/20 transition hover:bg-[#5B2BE0]"
          >
            <Download className="h-5 w-5" />
            <span>Export PDF Report</span>
          </button>
          <button
            type="button"
            onClick={onReturnHome}
            className="min-h-[40px] px-4 py-2 text-sm font-medium text-[#525866] hover:text-[#11131C]"
          >
            Return to Home
          </button>
        </div>
      </main>

      {editingTrace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={saveTraceEdit}
            className="w-full max-w-lg rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#11131C]">
                Edit Trace Decision
              </h2>
              <button
                type="button"
                onClick={() => setEditingTrace(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#646A7A] hover:bg-[#F3F4F8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-[#525866]">
                Key Insight
                <textarea
                  rows={2}
                  required
                  value={editingTrace.keyInsight}
                  onChange={(e) =>
                    setEditingTrace({ ...editingTrace, keyInsight: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DCE0E8] p-3 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>
              <label className="block text-xs font-medium text-[#525866]">
                Design Decision
                <textarea
                  rows={2}
                  required
                  value={editingTrace.designDecision}
                  onChange={(e) =>
                    setEditingTrace({ ...editingTrace, designDecision: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DCE0E8] p-3 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>
              <label className="block text-xs font-medium text-[#525866]">
                Researcher Annotation
                <textarea
                  rows={2}
                  value={editingTrace.annotatedNote}
                  onChange={(e) =>
                    setEditingTrace({ ...editingTrace, annotatedNote: e.target.value })
                  }
                  placeholder="Optional team note..."
                  className="mt-1 w-full rounded-xl border border-[#DCE0E8] p-3 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingTrace(null)}
                className="min-h-[42px] rounded-full px-4 py-2 text-sm font-medium text-[#525866]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUnsupported && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={saveUnsupportedEdit}
            className="w-full max-w-lg rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl"
          >
            <h2 className="font-display text-lg font-semibold text-[#11131C]">
              Annotate Unsupported Decision
            </h2>
            <textarea
              rows={3}
              value={editingUnsupported.annotatedNote}
              onChange={(e) =>
                setEditingUnsupported({ ...editingUnsupported, annotatedNote: e.target.value })
              }
              placeholder="Add rationale or next validation step..."
              className="mt-4 w-full rounded-xl border border-[#DCE0E8] p-3 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
            />
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingUnsupported(null)}
                className="min-h-[42px] rounded-full px-4 py-2 text-sm font-medium text-[#525866]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white"
              >
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUnmatched && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={saveUnmatchedEdit}
            className="w-full max-w-lg rounded-3xl border border-[#EAECEF] bg-white p-6 shadow-xl"
          >
            <h2 className="font-display text-lg font-semibold text-[#11131C]">
              Annotate Unmatched Insight
            </h2>
            <textarea
              rows={3}
              value={editingUnmatched.annotatedNote}
              onChange={(e) =>
                setEditingUnmatched({ ...editingUnmatched, annotatedNote: e.target.value })
              }
              placeholder="Add action item or planned screen..."
              className="mt-4 w-full rounded-xl border border-[#DCE0E8] p-3 text-sm text-[#11131C] outline-none focus:border-[#6C3BF5]"
            />
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingUnmatched(null)}
                className="min-h-[42px] rounded-full px-4 py-2 text-sm font-medium text-[#525866]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] rounded-full bg-[#6C3BF5] px-5 py-2 text-sm font-semibold text-white"
              >
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
