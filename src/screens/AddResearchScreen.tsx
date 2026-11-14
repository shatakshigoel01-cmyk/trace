import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CloudUpload,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { InsightItem, Project, ResearchFile } from '../types/trace';

interface AddResearchScreenProps {
  userName: string;
  project: Project;
  onBack: () => void;
  onOpenSettings: () => void;
  onUpdateProject: (updated: Project) => void;
  onInsightsGenerated: (insights: InsightItem[]) => void;
  onGoToInsights: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export const AddResearchScreen: React.FC<AddResearchScreenProps> = ({
  userName,
  project,
  onBack,
  onOpenSettings,
  onUpdateProject,
  onInsightsGenerated,
  onGoToInsights,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'notes'>('files');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ResearchFile | null>(null);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);
    setUploadingFiles(true);

    try {
      const newFiles: ResearchFile[] = [];
      for (const file of Array.from(fileList)) {
        const dataBase64 = await readFileAsBase64(file);
        const dotIdx = file.name.lastIndexOf('.');
        const extension = dotIdx >= 0 ? file.name.slice(dotIdx).toLowerCase() : '';

        const extractRes = await fetch('/api/extract-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            dataBase64,
          }),
        });

        const extractData = (await extractRes.json()) as {
          supportedForAi?: boolean;
          extractionMode?: 'text' | 'multimodal' | 'unsupported';
          extractedText?: string | null;
          reason?: string;
          error?: string;
        };

        if (!extractRes.ok) {
          throw new Error(extractData.error || `Failed to process ${file.name}`);
        }

        newFiles.push({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          extension: extension || 'file',
          dataBase64,
          extractedText: extractData.extractedText ?? null,
          extractionMode: extractData.extractionMode || 'unsupported',
          supportedForAi: Boolean(extractData.supportedForAi),
          statusMessage: extractData.reason,
          addedAt: Date.now(),
        });
      }

      onUpdateProject({
        ...project,
        researchFiles: [...project.researchFiles, ...newFiles],
        updatedAt: Date.now(),
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload files.');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    onUpdateProject({
      ...project,
      researchFiles: project.researchFiles.filter((f) => f.id !== fileId),
      updatedAt: Date.now(),
    });
  };

  const handleClearAll = () => {
    onUpdateProject({
      ...project,
      researchFiles: [],
      updatedAt: Date.now(),
    });
  };

  const handleNotesChange = (value: string) => {
    onUpdateProject({
      ...project,
      manualNotes: value,
      updatedAt: Date.now(),
    });
  };

  const handleAnalyseResearch = async () => {
    setErrorMsg(null);
    const hasNotes = project.manualNotes.trim().length > 0;
    const hasFiles = project.researchFiles.length > 0;

    if (!hasFiles && !hasNotes) {
      setErrorMsg('Upload at least one research file or add research notes before analysing.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          files: project.researchFiles.map((f) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            extractedText: f.extractedText,
            dataBase64: f.extractionMode === 'multimodal' ? f.dataBase64 : null,
            extractionMode: f.extractionMode,
            supportedForAi: f.supportedForAi,
          })),
          manualNotes: project.manualNotes,
        }),
      });

      const data = (await response.json()) as {
        insights?: InsightItem[];
        warnings?: string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Research analysis failed.');
      }

      onInsightsGenerated(data.insights || []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to analyse research.');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderFileIcon = (file: ResearchFile) => {
    if (file.mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-[#2563EB]" />;
    }
    if (file.extension === '.csv' || file.extension === '.xlsx') {
      return <FileSpreadsheet className="h-5 w-5 text-[#2563EB]" />;
    }
    return <FileText className="h-5 w-5 text-[#6C3BF5]" />;
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-[#646A7A]">
            <span className="font-semibold text-[#6C3BF5]">Step 1 of 4</span>
            <span aria-hidden="true">·</span>
            <span>Research Ingestion</span>
          </div>
          {project.insights.length > 0 && (
            <button
              type="button"
              onClick={onGoToInsights}
              className="text-xs font-semibold text-[#6C3BF5] hover:underline"
            >
              View Saved Insights ({project.insights.length})
            </button>
          )}
        </div>

        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#11131C]">
          Add Research Data
        </h1>
        <p className="mt-1 text-sm text-[#525866]">
          Select files from your device or write field notes manually.
        </p>

        {/* Segmented Toggle */}
        <div className="mt-5 grid grid-cols-2 rounded-2xl bg-[#EEF1F8] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`min-h-[42px] rounded-xl px-3 py-2 text-sm font-semibold transition ${
              activeTab === 'files'
                ? 'bg-white text-[#6C3BF5] shadow-xs'
                : 'text-[#525866] hover:text-[#11131C]'
            }`}
          >
            File Import ({project.researchFiles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`min-h-[42px] rounded-xl px-3 py-2 text-sm font-semibold transition ${
              activeTab === 'notes'
                ? 'bg-white text-[#6C3BF5] shadow-xs'
                : 'text-[#525866] hover:text-[#11131C]'
            }`}
          >
            Manual Notes
          </button>
        </div>

        {activeTab === 'files' ? (
          <div className="mt-5 space-y-5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,text/csv,image/*"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                void handleFilesSelected(e.dataTransfer.files);
              }}
              className={`flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
                isDragging
                  ? 'border-[#6C3BF5] bg-[#F3EEFF]'
                  : 'border-[#DDD6FE] bg-[#F7F6FC] hover:border-[#B9A4FC]'
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE9FE] text-[#6C3BF5]">
                {uploadingFiles ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <CloudUpload className="h-7 w-7" />
                )}
              </div>
              <p className="mt-4 font-display text-base font-semibold text-[#11131C]">
                {uploadingFiles ? 'Processing selected files...' : 'Tap or drag files to upload'}
              </p>
              <p className="mt-1 text-xs text-[#646A7A]">
                PDF, DOC, DOCX, TXT, CSV, XLSX, PPTX, PNG, JPG, WEBP
              </p>
            </button>

            {project.researchFiles.length > 0 && (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-[#11131C]">
                    Uploaded Files ({project.researchFiles.length})
                  </h2>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-semibold text-[#6C3BF5] hover:underline"
                  >
                    Clear all
                  </button>
                </div>

                <div className="mt-3 space-y-2.5">
                  {project.researchFiles.map((file) => (
                    <div
                      key={file.id}
                      className="rounded-2xl border border-[#EAECEF] bg-white p-3.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F9]">
                            {renderFileIcon(file)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#11131C]">
                              {file.name}
                            </p>
                            <p className="mt-0.5 text-xs text-[#646A7A]">
                              <span className="font-mono">{formatBytes(file.size)}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{file.extension.replace('.', '').toUpperCase()}</span>
                              <span aria-hidden="true"> · </span>
                              <span
                                className={
                                  file.supportedForAi ? 'text-[#2563EB] font-medium' : 'text-amber-700 font-medium'
                                }
                              >
                                {file.supportedForAi ? 'Ready for AI' : 'Retained (Cannot analyse)'}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            aria-label={`Preview ${file.name}`}
                            onClick={() => setPreviewFile(file)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F6FA] text-[#525866] transition hover:bg-[#EDE9FE] hover:text-[#6C3BF5]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${file.name}`}
                            onClick={() => handleRemoveFile(file.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F6FA] text-[#525866] transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {!file.supportedForAi && file.statusMessage && (
                        <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <span>{file.statusMessage}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <label className="block text-sm font-semibold text-[#11131C]">
              Manual Research Notes
              <textarea
                rows={9}
                value={project.manualNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Paste interview transcripts, user quotes, usability test observations, or survey notes here..."
                className="mt-2 w-full rounded-2xl border border-[#DCE0E8] bg-white p-4 text-sm leading-relaxed text-[#11131C] outline-none focus:border-[#6C3BF5]"
              />
            </label>
            <p className="mt-2 text-xs text-[#646A7A]">
              Saved automatically to this device.
            </p>
          </div>
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
          <button
            type="button"
            disabled={analyzing || uploadingFiles}
            onClick={handleAnalyseResearch}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#6C3BF5] px-6 py-3 text-base font-semibold text-white shadow-md shadow-[#6C3BF5]/20 transition hover:bg-[#5B2BE0] disabled:opacity-60"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analysing Research...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Analyse Research</span>
              </>
            )}
          </button>
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-3xl border border-[#EAECEF] bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EEF0F4]">
              <h3 className="truncate font-display text-base font-semibold text-[#11131C]">
                {previewFile.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#646A7A] hover:bg-[#F3F4F8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 overflow-y-auto text-sm text-[#3E4352]">
              {previewFile.mimeType.startsWith('image/') ? (
                <img
                  src={`data:${previewFile.mimeType};base64,${previewFile.dataBase64}`}
                  alt={previewFile.name}
                  className="mx-auto max-h-[55vh] rounded-xl object-contain"
                />
              ) : previewFile.extractedText ? (
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#3E4352]">
                  {previewFile.extractedText.slice(0, 8000)}
                </pre>
              ) : (
                <p className="py-4 text-sm text-[#525866]">
                  {previewFile.statusMessage ||
                    'Binary document attached and ready for direct AI inspection.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
