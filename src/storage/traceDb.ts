import { AppSettings, Project, UserProfile } from '../types/trace';

const DB_NAME = 'trace_local_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_META = 'meta';

const DEFAULT_PROFILE: UserProfile = {
  name: 'UX Researcher',
  role: 'Product Designer',
  workspace: 'Personal Workspace',
};

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  figmaAccessToken: null,
  figmaWorkspaceLabel: null,
  hasSeenWelcome: false,
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result as Project[]) || [];
      items.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.put(project);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProjectById(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly');
    const store = tx.objectStore(STORE_META);
    const req = store.get(key);
    req.onsuccess = () => {
      const record = req.result as { key: string; value: T } | undefined;
      resolve(record ? record.value : fallback);
    };
    req.onerror = () => reject(req.error);
  });
}

async function setMeta<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readwrite');
    const store = tx.objectStore(STORE_META);
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getUserProfile(): Promise<UserProfile> {
  return getMeta<UserProfile>('user_profile', DEFAULT_PROFILE);
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  return setMeta('user_profile', profile);
}

export async function getAppSettings(): Promise<AppSettings> {
  return getMeta<AppSettings>('app_settings', DEFAULT_SETTINGS);
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  return setMeta('app_settings', settings);
}

export async function getActiveProjectId(): Promise<string | null> {
  return getMeta<string | null>('active_project_id', null);
}

export async function saveActiveProjectId(id: string | null): Promise<void> {
  return setMeta('active_project_id', id);
}

export async function clearAllLocalData(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROJECTS, STORE_META], 'readwrite');
    tx.objectStore(STORE_PROJECTS).clear();
    tx.objectStore(STORE_META).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function createEmptyProject(name: string): Project {
  const now = Date.now();
  return {
    id: `proj_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || 'Untitled Project',
    createdAt: now,
    updatedAt: now,
    researchFiles: [],
    manualNotes: '',
    insights: [],
    designScreens: [],
    figmaUrl: '',
    traceResult: null,
  };
}
