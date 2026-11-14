export type ScreenRoute =
  | 'welcome'
  | 'home'
  | 'projects'
  | 'add-research'
  | 'insights'
  | 'connect-design'
  | 'final-trace'
  | 'settings';

export type InsightCategory =
  | 'key_finding'
  | 'common_pattern'
  | 'user_need'
  | 'research_gap';

export interface ResearchFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  dataBase64: string;
  extractedText: string | null;
  extractionMode: 'text' | 'multimodal' | 'unsupported';
  supportedForAi: boolean;
  statusMessage?: string;
  addedAt: number;
}

export interface InsightItem {
  id: string;
  category: InsightCategory;
  tag: string;
  title: string;
  evidence: string;
  sourceName: string;
}

export interface DesignScreen {
  id: string;
  name: string;
  mimeType: string;
  dataBase64: string;
  size: number;
  sourceType: 'screenshot' | 'figma';
  addedAt: number;
}

export interface TraceMatch {
  id: string;
  evidence: string;
  keyInsight: string;
  relatedScreenId: string;
  relatedScreenName: string;
  designDecision: string;
  confidenceLabel: string;
  confirmed: boolean;
  annotatedNote: string;
}

export interface UnsupportedDecision {
  id: string;
  screenId: string;
  screenName: string;
  designDecision: string;
  reason: string;
  reviewed: boolean;
  annotatedNote: string;
}

export interface UnmatchedInsight {
  id: string;
  insightId: string;
  keyInsight: string;
  evidence: string;
  sourceName: string;
  reason: string;
  annotatedNote: string;
}

export interface TraceAnalysisResult {
  supportedTraces: TraceMatch[];
  unsupportedDecisions: UnsupportedDecision[];
  unmatchedInsights: UnmatchedInsight[];
  analyzedAt: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  researchFiles: ResearchFile[];
  manualNotes: string;
  insights: InsightItem[];
  designScreens: DesignScreen[];
  figmaUrl: string;
  traceResult: TraceAnalysisResult | null;
}

export interface UserProfile {
  name: string;
  role: string;
  workspace: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  figmaAccessToken: string | null;
  figmaWorkspaceLabel: string | null;
  hasSeenWelcome: boolean;
}
