import { supabase, isSupabaseConfigured } from './supabase.ts';
import { SyncStatus } from '../types.ts';

// Feature progress keys in the normalized user_progress table
export const SYNC_KEYS = {
  PR_GUIDE_STEPS: 'pr_guide_steps',
  ROADMAP_DATA: 'roadmap_data',
  ROADMAP_CHECKED_TASKS: 'roadmap_checked_tasks',
  LEARNING_CENTER_MODULES: 'learning_center_modules',
  LEARNING_TASKS: 'learning_tasks',
  SAVED_ITEMS: 'saved_items',
  SAVED_IDEAS: 'saved_ideas',
  SAVED_REPOS: 'saved_repos',
  PR_COUNT: 'pr_count',
} as const;

// Maximum payload size per progress key to avoid abuse (100KB)
const MAX_PROGRESS_DATA_BYTES = 100 * 1024;

/**
 * Validates and ensures progress data contains no secrets and does not exceed size limits.
 */
function validateProgressData(data: unknown): boolean {
  if (data === null || data === undefined) return false;
  try {
    const serialized = JSON.stringify(data);
    if (serialized.length > MAX_PROGRESS_DATA_BYTES) {
      console.warn('Progress data payload exceeds size limit (100KB), skipping cloud sync.');
      return false;
    }
    // Prevent accidental leak of secret keys or authorization tokens
    const lower = serialized.toLowerCase();
    if (
      lower.includes('api_key') ||
      lower.includes('access_token') ||
      lower.includes('secret') ||
      lower.includes('aiza') ||
      lower.includes('ghp_')
    ) {
      console.warn('Attempted to sync object containing sensitive token, rejected.');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves a single progress item to Supabase user_progress table with RLS.
 */
export async function saveCloudProgressItem(
  userId: string,
  progressKey: string,
  progressData: unknown
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !userId) {
    return { success: false, error: 'Supabase unconfigured or no user' };
  }

  if (!validateProgressData(progressData)) {
    return { success: false, error: 'Validation failed or data exceeds safe size limit' };
  }

  try {
    const { error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          progress_key: progressKey,
          progress_data: progressData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,progress_key' }
      );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network sync error';
    return { success: false, error: msg };
  }
}

/**
 * Loads all user_progress records for the authenticated user from Supabase.
 */
export async function loadCloudProgress(
  userId: string
): Promise<{ data: Record<string, any>; error?: string }> {
  if (!isSupabaseConfigured() || !userId) {
    return { data: {}, error: 'Not authenticated or Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('progress_key, progress_data, updated_at')
      .eq('user_id', userId);

    if (error) {
      return { data: {}, error: error.message };
    }

    const progressMap: Record<string, any> = {};
    if (Array.isArray(data)) {
      for (const row of data) {
        progressMap[row.progress_key] = row.progress_data;
      }
    }

    return { data: progressMap };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network load error';
    return { data: {}, error: msg };
  }
}

/**
 * Checks whether the browser has local progress available to import.
 */
export function hasLocalProgressData(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const prSteps = localStorage.getItem('codebridge_pr_guide_completed_steps');
    const roadmap = localStorage.getItem('codebridge_cached_roadmap');
    const learning = localStorage.getItem('codebridge_learning_center_completed_modules');
    const savedItems = localStorage.getItem('codebridge_saved_items');
    const savedIdeas = localStorage.getItem('codebridge_saved_ideas');
    const savedRepos = localStorage.getItem('codebridge_saved_repos');
    const prCount = localStorage.getItem('codebridge_pr_count');

    if (prSteps && Object.keys(JSON.parse(prSteps)).length > 0) return true;
    if (roadmap && JSON.parse(roadmap)) return true;
    if (learning && Object.keys(JSON.parse(learning)).length > 0) return true;
    if (savedItems && JSON.parse(savedItems).length > 0) return true;
    if (savedIdeas && JSON.parse(savedIdeas).length > 0) return true;
    if (savedRepos && JSON.parse(savedRepos).length > 0) return true;
    if (prCount && parseInt(prCount, 10) > 1) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Deterministically merges cloud data and local browser storage.
 * Union for sets (completed steps, modules, bookmarks) to avoid data loss.
 */
export function mergeProgressData(
  cloudData: Record<string, any>,
  localData: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = { ...cloudData };

  // 1. PR Guide Steps: Union of completed step numbers
  const cloudPr = (cloudData[SYNC_KEYS.PR_GUIDE_STEPS] as Record<string, boolean>) || {};
  const localPr = (localData[SYNC_KEYS.PR_GUIDE_STEPS] as Record<string, boolean>) || {};
  merged[SYNC_KEYS.PR_GUIDE_STEPS] = { ...cloudPr, ...localPr };

  // 2. Learning Center Modules: Union of completed modules
  const cloudLearning = (cloudData[SYNC_KEYS.LEARNING_CENTER_MODULES] as Record<string, boolean>) || {};
  const localLearning = (localData[SYNC_KEYS.LEARNING_CENTER_MODULES] as Record<string, boolean>) || {};
  merged[SYNC_KEYS.LEARNING_CENTER_MODULES] = { ...cloudLearning, ...localLearning };

  // 3. Roadmap Checked Tasks: Union of checked task IDs
  const cloudTasks = (cloudData[SYNC_KEYS.ROADMAP_CHECKED_TASKS] as Record<string, boolean>) || {};
  const localTasks = (localData[SYNC_KEYS.ROADMAP_CHECKED_TASKS] as Record<string, boolean>) || {};
  merged[SYNC_KEYS.ROADMAP_CHECKED_TASKS] = { ...cloudTasks, ...localTasks };

  // 4. Roadmap Data: Cloud preferred if present, otherwise local
  merged[SYNC_KEYS.ROADMAP_DATA] = cloudData[SYNC_KEYS.ROADMAP_DATA] || localData[SYNC_KEYS.ROADMAP_DATA] || null;

  // 5. Hacktoberfest PR Count: Max of counts
  const cloudCount = Number(cloudData[SYNC_KEYS.PR_COUNT]) || 0;
  const localCount = Number(localData[SYNC_KEYS.PR_COUNT]) || 0;
  merged[SYNC_KEYS.PR_COUNT] = Math.max(cloudCount, localCount);

  // 6. Saved Items: Merge arrays by unique ID
  const cloudItems = Array.isArray(cloudData[SYNC_KEYS.SAVED_ITEMS]) ? cloudData[SYNC_KEYS.SAVED_ITEMS] : [];
  const localItems = Array.isArray(localData[SYNC_KEYS.SAVED_ITEMS]) ? localData[SYNC_KEYS.SAVED_ITEMS] : [];
  const itemMap = new Map();
  for (const item of [...cloudItems, ...localItems]) {
    if (item && item.id) itemMap.set(item.id, item);
  }
  merged[SYNC_KEYS.SAVED_ITEMS] = Array.from(itemMap.values());

  // 7. Saved Ideas: Merge arrays by title
  const cloudIdeas = Array.isArray(cloudData[SYNC_KEYS.SAVED_IDEAS]) ? cloudData[SYNC_KEYS.SAVED_IDEAS] : [];
  const localIdeas = Array.isArray(localData[SYNC_KEYS.SAVED_IDEAS]) ? localData[SYNC_KEYS.SAVED_IDEAS] : [];
  const ideaMap = new Map();
  for (const idea of [...cloudIdeas, ...localIdeas]) {
    if (idea && idea.title) ideaMap.set(idea.title, idea);
  }
  merged[SYNC_KEYS.SAVED_IDEAS] = Array.from(ideaMap.values());

  // 8. Saved Repos: Merge arrays by fullName
  const cloudRepos = Array.isArray(cloudData[SYNC_KEYS.SAVED_REPOS]) ? cloudData[SYNC_KEYS.SAVED_REPOS] : [];
  const localRepos = Array.isArray(localData[SYNC_KEYS.SAVED_REPOS]) ? localData[SYNC_KEYS.SAVED_REPOS] : [];
  const repoMap = new Map();
  for (const repo of [...cloudRepos, ...localRepos]) {
    if (repo && repo.fullName) repoMap.set(repo.fullName, repo);
  }
  merged[SYNC_KEYS.SAVED_REPOS] = Array.from(repoMap.values());

  // 9. Learning Tasks: Merge by ID
  const cloudLTasks = Array.isArray(cloudData[SYNC_KEYS.LEARNING_TASKS]) ? cloudData[SYNC_KEYS.LEARNING_TASKS] : [];
  const localLTasks = Array.isArray(localData[SYNC_KEYS.LEARNING_TASKS]) ? localData[SYNC_KEYS.LEARNING_TASKS] : [];
  const lTaskMap = new Map();
  for (const t of [...localLTasks, ...cloudLTasks]) {
    if (t && t.id) lTaskMap.set(t.id, t);
  }
  merged[SYNC_KEYS.LEARNING_TASKS] = Array.from(lTaskMap.values());

  return merged;
}

/**
 * Reads all relevant local progress keys from browser localStorage safely.
 */
export function getLocalProgressSnapshot(): Record<string, any> {
  const snapshot: Record<string, any> = {};
  if (typeof window === 'undefined') return snapshot;

  const safeParse = (key: string, fallback: any) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  };

  snapshot[SYNC_KEYS.PR_GUIDE_STEPS] = safeParse('codebridge_pr_guide_completed_steps', {});
  snapshot[SYNC_KEYS.ROADMAP_DATA] = safeParse('codebridge_cached_roadmap', null);
  snapshot[SYNC_KEYS.ROADMAP_CHECKED_TASKS] = safeParse('codebridge_roadmap_checked_tasks', {});
  snapshot[SYNC_KEYS.LEARNING_CENTER_MODULES] = safeParse('codebridge_learning_center_completed_modules', {});
  snapshot[SYNC_KEYS.SAVED_ITEMS] = safeParse('codebridge_saved_items', []);
  snapshot[SYNC_KEYS.SAVED_IDEAS] = safeParse('codebridge_saved_ideas', []);
  snapshot[SYNC_KEYS.SAVED_REPOS] = safeParse('codebridge_saved_repos', []);
  snapshot[SYNC_KEYS.LEARNING_TASKS] = safeParse('codebridge_tasks', []);

  try {
    const countVal = localStorage.getItem('codebridge_pr_count');
    snapshot[SYNC_KEYS.PR_COUNT] = countVal ? parseInt(countVal, 10) || 0 : 0;
  } catch {
    snapshot[SYNC_KEYS.PR_COUNT] = 0;
  }

  return snapshot;
}

/**
 * Writes a merged progress snapshot into browser localStorage.
 */
export function applyMergedProgressToLocal(merged: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  const safeSet = (key: string, val: any) => {
    try {
      if (val !== undefined && val !== null) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    } catch {
      // quota handling
    }
  };

  if (merged[SYNC_KEYS.PR_GUIDE_STEPS]) {
    safeSet('codebridge_pr_guide_completed_steps', merged[SYNC_KEYS.PR_GUIDE_STEPS]);
  }
  if (merged[SYNC_KEYS.ROADMAP_DATA]) {
    safeSet('codebridge_cached_roadmap', merged[SYNC_KEYS.ROADMAP_DATA]);
  }
  if (merged[SYNC_KEYS.ROADMAP_CHECKED_TASKS]) {
    safeSet('codebridge_roadmap_checked_tasks', merged[SYNC_KEYS.ROADMAP_CHECKED_TASKS]);
  }
  if (merged[SYNC_KEYS.LEARNING_CENTER_MODULES]) {
    safeSet('codebridge_learning_center_completed_modules', merged[SYNC_KEYS.LEARNING_CENTER_MODULES]);
  }
  if (merged[SYNC_KEYS.SAVED_ITEMS]) {
    safeSet('codebridge_saved_items', merged[SYNC_KEYS.SAVED_ITEMS]);
  }
  if (merged[SYNC_KEYS.SAVED_IDEAS]) {
    safeSet('codebridge_saved_ideas', merged[SYNC_KEYS.SAVED_IDEAS]);
  }
  if (merged[SYNC_KEYS.SAVED_REPOS]) {
    safeSet('codebridge_saved_repos', merged[SYNC_KEYS.SAVED_REPOS]);
  }
  if (merged[SYNC_KEYS.LEARNING_TASKS]) {
    safeSet('codebridge_tasks', merged[SYNC_KEYS.LEARNING_TASKS]);
  }
  if (merged[SYNC_KEYS.PR_COUNT] !== undefined) {
    try {
      localStorage.setItem('codebridge_pr_count', String(merged[SYNC_KEYS.PR_COUNT]));
    } catch {
      // ignore
    }
  }

  // Dispatch custom storage event so other components update their state
  window.dispatchEvent(new Event('codebridge_progress_updated'));
}

/**
 * Deletes all cloud-persisted user progress rows for the authenticated user.
 */
export async function deleteAllCloudProgress(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !userId) {
    return { success: false, error: 'Not authenticated or Supabase unconfigured' };
  }

  try {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete cloud data';
    return { success: false, error: msg };
  }
}
