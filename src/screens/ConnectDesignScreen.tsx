import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Image as ImageIcon,
  Info,
  Layers,
  Link2,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { AppSettings, DesignScreen, Project, TraceAnalysisResult } from '../types/trace';
import { resolveApiUrl } from '../utils/apiClient';

interface ConnectDesignScreenProps {
  userName: string;
  project: Project;
  settings: AppSettings;
  onBack: () => void;
  onOpenSettings: () => void;
  onUpdateProject: (updated: Project) => void;
  onUpdateSettings: (updated: AppSettings) => void;
  onTraceCompleted: (result: TraceAnalysisResult) => void;
  onGoToTrace: () => void;
}

function readImageBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ConnectDesignScreen: React.FC<ConnectDesignScreenProps> = ({
  userName,
  project,
  settings,
  onBack,
  onOpenSettings,
  onUpdateProject,
  onUpdateSettings,
  onTraceCompleted,
  onGoToTrace,
}) => {
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const [sourceTab, setSourceTab] = useState<'figma' | 'screenshots'>(
    project.designScreens.some((s) => s.sourceType === 'figma') ? 'figma' : 'screenshots'
  );
  const [figmaOauthConfigured, setFigmaOauthConfigured] = useState<boolean | null>(null);
  const [figmaSetupMessage, setFigmaSetupMessage] = useState<string | null>(null);
  const [loadingFigma, setLoadingFigma] = useState(false);
  const [analyzingTrace, setAnalyzingTrace] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let url = '';
    try {
      url = resolveApiUrl('/api/figma/status', settings.backendUrl);
    } catch {
      setFigmaOauthConfigured(false);
      setFigmaSetupMessage(
        'Figma OAuth requires a configured TRACE backend server URL in Settings. Use Screenshots to upload UI images directly.'
      );
      return;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data: { oauthConfigured?: boolean; setupMessage?: string | null }) => {
        setFigmaOauthConfigured(Boolean(data.oauthConfigured));
        setFigmaSetupMessage(data.setupMessage || null);
      })
      .catch(() => {
        setFigmaOauthConfigured(false);
        setFigmaSetupMessage(
          'Unable to verify Figma server configuration. Upload UI screenshots directly instead.'
        );
      });
  }, [settings.backendUrl]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FIGMA_OAUTH_TOKEN' && event.data.accessToken) {
        onUpdateSettings({
          ...settings,
          figmaAccessToken: String(event.data.accessToken),
          figmaWorkspaceLabel: 'Figma OAuth Connected',
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [settings, onUpdateSettings]);

  const handleUploadScreenshots = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    try {
      const added: DesignScreen[] = [];
      for (const file of Array.from(fileList)) {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          setErrorMsg('Please select PNG, JPG, or WEBP image files.');
          continue;
        }
        const dataBase64 = await readImageBase64(file);
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        added.push({
          id: `screen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: cleanName || 'Design Screen',
          mimeType: file.type,
          dataBase64,
          size: file.size,
          sourceType: 'screenshot',
          addedAt: Date.now(),
        });
      }
      if (added.length > 0) {
        onUpdateProject({
          ...project,
          designScreens: [...project.designScreens, ...added],
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load screenshot.');
    } finally {
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
    }
  };

  const handleReplaceScreenshot = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !replacingId) return;
    const file = fileList[0];
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrorMsg('Replacement file must be PNG, JPG, or WEBP.');
      return;
    }
    try {
      const dataBase64 = await readImageBase64(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      onUpdateProject({
        ...project,
        designScreens: project.designScreens.map((s) =>
          s.id === replacingId
            ? {
                ...s,
                name: cleanName || s.name,
                mimeType: file.type,
                dataBase64,
                size: file.size,
                addedAt: Date.now(),
              }
            : s
        ),
        updatedAt: Date.now(),
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to replace screenshot.');
    } finally {
      setReplacingId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleAuthorizeFigma = () => {
    setErrorMsg(null);
    if (!figmaOauthConfigured) {
      setErrorMsg(
        figmaSetupMessage ||
          'Figma OAuth requires server configuration. Use Screenshots to upload UI images.'
      );
      return;
    }
    const popup = window.open(
      '/api/figma/auth',
      'figma_oauth',
      'width=540,height=700,noopener=false'
    );
    if (!popup) {
      setErrorMsg('Popup was blocked by your browser. Please allow popups to authorize Figma.');
    }
  };

  const handleLoadFigmaFrames = async () => {
    setErrorMsg(null);
    if (!settings.figmaAccessToken) {
      handleAuthorizeFigma();
      return;
    }
    if (!project.figmaUrl.trim()) {
      setErrorMsg('Enter a Figma design URL first.');
      return;
    }

    setLoadingFigma(true);
    try {
      const res = await fetch(resolveApiUrl('/api/figma/frames', settings.backendUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.figmaAccessToken}`,
        },
        body: JSON.stringify({ fileUrl: project.figmaUrl }),
      });
      const data = (await res.json()) as {
        screens?: Array<{
          id: string;
          name: string;
          mimeType: string;
          dataBase64: string;
          sourceType: 'figma';
        }>;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load Figma frames.');
      }

      const loaded: DesignScreen[] = (data.screens || []).map((f) => ({
        ...f,
        size: Math.round((f.dataBase64.length * 3) / 4),
        addedAt: Date.now(),
      }));

      if (loaded.length === 0) {
        setErrorMsg('No top-level frames were found in this Figma file.');
        return;
      }

      onUpdateProject({
        ...project,
        designScreens: [
          ...project.designScreens.filter((s) => s.sourceType !== 'figma'),
          ...loaded,
        ],
        updatedAt: Date.now(),
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to fetch Figma frames.');
    } finally {
      setLoadingFigma(false);
    }
  };

  const handleAnalyseAndConnect = async () => {
    setErrorMsg(null);
    if (project.insights.length === 0) {
      setErrorMsg(
        'This project has no research insights yet. Add and analyse research before running Trace.'
      );
      return;
    }
    if (project.designScreens.length === 0) {
      setErrorMsg('Upload at least one UI screenshot or load Figma frames first.');
      return;
    }

    setAnalyzingTrace(true);
    try {
      const res = await fetch(resolveApiUrl('/api/trace-analysis', settings.backendUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          insights: project.insights,
          screens: project.designScreens.map((s) => ({
            id: s.id,
            name: s.name,
            mimeType: s.mimeType,
            dataBase64: s.dataBase64,
          })),
        }),
      });
      const data = (await res.json()) as {
        supportedTraces?: TraceAnalysisResult['supportedTraces'];
        unsupportedDecisions?: TraceAnalysisResult['unsupportedDecisions'];
        unmatchedInsights?: TraceAnalysisResult['unmatchedInsights'];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Trace analysis failed.');
      }

      onTraceCompleted({
        supportedTraces: data.supportedTraces || [],
        unsupportedDecisions: data.unsupportedDecisions || [],
        unmatchedInsights: data.unmatchedInsights || [],
        analyzedAt: Date.now(),
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Trace analysis failed.');
    } finally {
      setAnalyzingTrace(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] pb-32">
      <TopBar
        subtitle={project.name}
        onBack={onBack}
        userName={userName}
        onOpenSettings={onOpenSettings}
      />

      <main className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        <div className="flex items-center justify-between text-xs text-[#646A7A]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#6C3BF5]">Step 3 of 4</span>
            <span aria-hidden="true">·</span>
            <span>Design Source</span>
          </div>
          {project.traceResult && (
            <button
              type="button"
              onClick={onGoToTrace}
              className="font-semibold text-[#6C3BF5] hover:underline"
            >
              View Saved Trace
            </button>
          )}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#ECEEF4]">
          <div className="h-full w-3/4 rounded-full bg-[#6C3BF5]" />
        </div>

        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-[#11131C]">
          Connect Design
        </h1>
        <p className="mt-1 text-sm text-[#525866]">
          Select a design source to trace against your research insights.
        </p>

        {/* Source Segmented Toggle */}
        <div className="mt-5 grid grid-cols-2 rounded-2xl bg-[#EEF1F8] p-1">
          <button
            type="button"
            onClick={() => setSourceTab('figma')}
            className={`flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              sourceTab === 'figma'
                ? 'bg-white text-[#6C3BF5] shadow-xs'
                : 'text-[#525866] hover:text-[#11131C]'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Figma File</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceTab('screenshots')}
            className={`flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              sourceTab === 'screenshots'
                ? 'bg-white text-[#6C3BF5] shadow-xs'
                : 'text-[#525866] hover:text-[#11131C]'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Screenshots ({project.designScreens.length})</span>
          </button>
        </div>

        {sourceTab === 'figma' ? (
          <div className="mt-5 rounded-3xl border border-[#EAECEF] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#11131C]">
                  Figma Authorization
                </h2>
                <p className="mt-0.5 text-xs text-[#646A7A]">
                  OAuth 2.0 live frame &amp; node access
                </p>
              </div>
              <span
                className={`text-xs font-semibold ${
                  settings.figmaAccessToken
                    ? 'text-emerald-700'
                    : figmaOauthConfigured
                      ? 'text-[#2563EB]'
                      : 'text-amber-700'
                }`}
              >
                {settings.figmaAccessToken
                  ? 'Connected'
                  : figmaOauthConfigured
                    ? 'Ready to Authorize'
                    : 'Setup Required'}
              </span>
            </div>

            {figmaOauthConfigured === false ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div className="text-xs leading-relaxed text-amber-900">
                    <p className="font-semibold">Figma OAuth not configured</p>
                    <p className="mt-1">
                      {figmaSetupMessage ||
                        'Add FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET in server environment secrets to connect live Figma files.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSourceTab('screenshots')}
                  className="mt-3.5 inline-flex min-h-[38px] items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#11131C] border border-amber-200 hover:bg-amber-100/50"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-[#6C3BF5]" />
                  <span>Upload Screenshots Instead</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <label className="block text-xs font-semibold text-[#3E4352]">
                  File URL or Node Link
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#DCE0E8] bg-[#F9FAFC] px-3 py-2.5">
                    <Link2 className="h-4 w-4 shrink-0 text-[#646A7A]" />
                    <input
                      type="url"
                      value={project.figmaUrl}
                      onChange={(e) =>
                        onUpdateProject({
                          ...project,
                          figmaUrl: e.target.value,
                          updatedAt: Date.now(),
                        })
                      }
                      placeholder="https://www.figma.com/design/..."
                      className="w-full bg-transparent text-sm text-[#11131C] outline-none"
                    />
                  </div>
                </label>

                <button
                  type="button"
                  disabled={loadingFigma}
                  onClick={handleLoadFigmaFrames}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#6C3BF5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5B2BE0] disabled:opacity-60"
                >
                  {loadingFigma ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading Figma Frames...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>
                        {settings.figmaAccessToken ? 'Load Frames' : 'Authorize & Load Frames'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <input
              ref={screenshotInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleUploadScreenshots(e.target.files)}
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleReplaceScreenshot(e.target.files)}
            />

            <button
              type="button"
              onClick={() => screenshotInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#C7DBFF] bg-[#F4F8FF] px-6 py-8 text-center transition hover:border-[#2563EB]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0ECFF] text-[#2563EB]">
                <Upload className="h-6 w-6" />
              </div>
              <p className="mt-3 font-display text-base font-semibold text-[#11131C]">
                Upload UI Screenshots
              </p>
              <p className="mt-1 text-xs text-[#525866]">
                Select multiple PNG, JPG, or WEBP screens from your device
              </p>
            </button>
          </div>
        )}

        {project.designScreens.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-base font-semibold text-[#11131C]">
              Connected Design Screens ({project.designScreens.length})
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {project.designScreens.map((screen) => (
                <div
                  key={screen.id}
                  className="flex items-center gap-3.5 rounded-2xl border border-[#EAECEF] bg-white p-3"
                >
                  <img
                    src={`data:${screen.mimeType};base64,${screen.dataBase64}`}
                    alt={screen.name}
                    className="h-20 w-16 shrink-0 rounded-xl border border-[#EAECEF] bg-[#F5F6FA] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      aria-label="Screen name"
                      value={screen.name}
                      onChange={(e) =>
                        onUpdateProject({
                          ...project,
                          designScreens: project.designScreens.map((s) =>
                            s.id === screen.id ? { ...s, name: e.target.value } : s
                          ),
                          updatedAt: Date.now(),
                        })
                      }
                      className="w-full truncate rounded-lg border border-transparent px-1.5 py-1 text-sm font-semibold text-[#11131C] outline-none focus:border-[#6C3BF5] focus:bg-[#F9FAFC]"
                    />
                    <p className="mt-0.5 px-1.5 text-xs text-[#646A7A]">
                      {screen.sourceType === 'figma' ? 'Figma Frame' : 'Screenshot'} ·{' '}
                      <span className="font-mono">{formatBytes(screen.size)}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-3 px-1.5">
                      {screen.sourceType === 'screenshot' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplacingId(screen.id);
                            replaceInputRef.current?.click();
                          }}
                          className="text-xs font-semibold text-[#2563EB] hover:underline"
                        >
                          Replace
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProject({
                            ...project,
                            designScreens: project.designScreens.filter((s) => s.id !== screen.id),
                            updatedAt: Date.now(),
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {errorMsg && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#EAECEF] bg-white/95 px-4 py-3 backdrop-blur-md pb-safe">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[#646A7A]">Mapped Against</span>
            <span className="font-semibold text-[#6C3BF5]">
              {project.insights.length} Research Insights
            </span>
          </div>
          <button
            type="button"
            disabled={analyzingTrace}
            onClick={handleAnalyseAndConnect}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#6C3BF5] px-6 py-3 text-base font-semibold text-white shadow-md shadow-[#6C3BF5]/20 transition hover:bg-[#5B2BE0] disabled:opacity-60"
          >
            {analyzingTrace ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analysing &amp; Tracing Decisions...</span>
              </>
            ) : (
              <span>Analyse &amp; Connect</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
