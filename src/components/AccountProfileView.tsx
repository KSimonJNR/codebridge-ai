import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Lock,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  ExternalLink,
  Info,
  KeyRound,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  loadCloudProgress,
  saveCloudProgressItem,
  hasLocalProgressData,
  getLocalProgressSnapshot,
  mergeProgressData,
  applyMergedProgressToLocal,
  deleteAllCloudProgress,
  SYNC_KEYS,
} from '../lib/progressSync.ts';
import { ActiveTab, SyncStatus } from '../types.ts';

interface AccountProfileViewProps {
  onOpenAuthModal: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const AccountProfileView: React.FC<AccountProfileViewProps> = ({
  onOpenAuthModal,
  onNavigateTab,
}) => {
  const { user, profile, signOut, updatePassword, isConfigured } = useAuth();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cloudCounts, setCloudCounts] = useState<{
    prSteps: number;
    hasRoadmap: boolean;
    learningModules: number;
    savedItems: number;
    prCount: number;
  }>({
    prSteps: 0,
    hasRoadmap: false,
    learningModules: 0,
    savedItems: 0,
    prCount: 0,
  });

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync state
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hasLocalToImport, setHasLocalToImport] = useState(false);

  useEffect(() => {
    setHasLocalToImport(hasLocalProgressData());
  }, []);

  const fetchCloudStats = async () => {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      const { data, error } = await loadCloudProgress(user.id);
      if (error) {
        setSyncStatus('error');
        setSyncMessage(`Sync check error: ${error}`);
      } else {
        const prSteps = data[SYNC_KEYS.PR_GUIDE_STEPS] || {};
        const learning = data[SYNC_KEYS.LEARNING_CENTER_MODULES] || {};
        const savedItems = data[SYNC_KEYS.SAVED_ITEMS] || [];
        const savedRepos = data[SYNC_KEYS.SAVED_REPOS] || [];
        const roadmap = data[SYNC_KEYS.ROADMAP_DATA];
        const prCount = data[SYNC_KEYS.PR_COUNT] || 0;

        setCloudCounts({
          prSteps: Object.keys(prSteps).length,
          hasRoadmap: Boolean(roadmap),
          learningModules: Object.keys(learning).length,
          savedItems: savedItems.length + savedRepos.length,
          prCount: Number(prCount) || 0,
        });

        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    if (user) {
      fetchCloudStats();
    }
  }, [user]);

  const handleManualSync = async () => {
    if (!user) return;
    setSyncStatus('syncing');
    setSyncMessage(null);

    try {
      // 1. Fetch current cloud data
      const { data: cloudData, error } = await loadCloudProgress(user.id);
      if (error) {
        setSyncStatus('error');
        setSyncMessage(`Failed to read cloud progress: ${error}`);
        return;
      }

      // 2. Read local data
      const localData = getLocalProgressSnapshot();

      // 3. Merge deterministically
      const merged = mergeProgressData(cloudData, localData);

      // 4. Push merged keys to cloud
      for (const [key, val] of Object.entries(merged)) {
        if (val !== undefined && val !== null) {
          await saveCloudProgressItem(user.id, key, val);
        }
      }

      // 5. Update local storage with merged state
      applyMergedProgressToLocal(merged);

      setSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSyncMessage('All progress successfully synchronized between device and cloud!');
      setHasLocalToImport(false);
      await fetchCloudStats();
    } catch (err: unknown) {
      setSyncStatus('error');
      setSyncMessage('Sync operation encountered network error.');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setPwdError(error.message);
      } else {
        setPwdSuccess('Password successfully updated!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPwdError('Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAllProgress = async () => {
    if (!user || deleteConfirmText.toLowerCase() !== 'delete') return;

    setDeleteLoading(true);
    try {
      const { success, error } = await deleteAllCloudProgress(user.id);
      if (success) {
        setShowDeleteModal(false);
        setDeleteConfirmText('');
        await fetchCloudStats();
        setSyncMessage('All cloud progress data was permanently removed.');
      } else {
        alert(error || 'Failed to delete data');
      }
    } catch {
      alert('Network error while deleting data.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Unauthenticated / Anonymous Guard
  if (!user) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-6 pb-16">
        <div className="card-71 p-8 sm:p-10 text-center space-y-5">
          <div className="w-12 h-12 rounded-[12px] bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle mx-auto">
            <Cloud className="w-6 h-6 text-accent" />
          </div>

          <div className="space-y-1.5">
            <div className="badge-71 inline-flex items-center gap-1.5 mx-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Cross-Device Cloud Sync</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal tracking-tight">
              <span className="font-medium text-ink-strong">Sign In</span>{' '}
              <span className="font-normal text-ink-subtle">· Contributor Account</span>
            </h2>
            <p className="text-[13px] text-ink-subtle max-w-md mx-auto leading-relaxed">
              Create an account or sign in with GitHub or Google to sync your Pull Request guide, completed Learning Center modules, and roadmaps across any computer or mobile browser.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="w-full sm:w-auto h-8 px-5 rounded-[10px] bg-accent hover:bg-accent-hover text-white text-[13px] font-medium transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In or Register</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="w-full sm:w-auto h-8 px-4 rounded-[10px] bg-surface-2 hover:bg-surface border border-hairline text-ink text-[12px] font-medium transition-colors cursor-pointer"
            >
              Continue Anonymously &rarr;
            </button>
          </div>

          <div className="pt-4 border-t border-hairline text-[11px] text-ink-subtle leading-relaxed">
            Anonymous local progress is automatically preserved in your browser's localStorage.
          </div>
        </div>
      </div>
    );
  }

  const authProvider = user.app_metadata?.provider || 'email';
  const creationDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Authenticated Contributor Profile</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-normal tracking-tight">
            <span className="font-medium text-ink-strong">Account & Sync</span>{' '}
            <span className="font-normal text-ink-subtle">· Cloud preferences</span>
          </h2>
          <p className="text-[13px] text-ink-subtle mt-0.5">
            Manage your authenticated profile and cross-device progress synchronization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="self-start sm:self-auto h-8 px-3 rounded-[10px] bg-surface-2 hover:bg-surface text-ink-subtle hover:text-rose-500 border border-hairline text-[12px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className="card-71 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-surface-2 border border-hairline text-ink-subtle flex items-center justify-center font-medium shrink-0">
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-4 h-4 text-accent animate-spin" />
            ) : syncStatus === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <Cloud className="w-4 h-4 text-emerald-500" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-medium text-ink-strong">
                {syncStatus === 'syncing'
                  ? 'Synchronizing Progress...'
                  : syncStatus === 'error'
                  ? 'Sync Network Issue'
                  : 'Cloud Progress Synchronized'}
              </h3>
              <span
                className={`badge-71 uppercase text-[10px] ${
                  syncStatus === 'synced'
                    ? 'text-emerald-500 border-emerald-500/25 bg-emerald-500/10'
                    : syncStatus === 'syncing'
                    ? 'text-accent border-accent/25 bg-accent/10'
                    : 'text-amber-500 border-amber-500/25 bg-amber-500/10'
                }`}
              >
                {syncStatus}
              </span>
            </div>
            <p className="text-[12px] text-ink-subtle mt-0.5 font-mono">
              {lastSyncedAt ? `Last synced today at ${lastSyncedAt}` : 'Synchronized with secure Supabase RLS'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasLocalToImport && (
            <button
              type="button"
              onClick={handleManualSync}
              className="h-8 px-3.5 rounded-[10px] bg-accent hover:bg-accent-hover text-white text-[12px] font-medium transition-colors cursor-pointer"
            >
              Import Local Progress
            </button>
          )}

          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing'}
            className="h-8 px-3 rounded-[10px] bg-surface-2 hover:bg-surface text-ink text-[12px] font-medium border border-hairline transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-accent' : 'text-ink-subtle'}`} />
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="card-71 p-3 text-[12px] text-ink flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Profile Details & Cloud Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Card */}
        <div className="card-71 p-5 space-y-4">
          <div className="flex items-center gap-3 border-b border-hairline pb-4">
            <div className="w-10 h-10 rounded-[10px] bg-surface-2 border border-hairline flex items-center justify-center text-ink-strong font-medium text-sm shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-[10px] object-cover"
                />
              ) : (
                user.email?.[0]?.toUpperCase() || 'U'
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-[14px] font-medium text-ink-strong truncate">
                {profile?.fullName || user.email?.split('@')[0] || 'Contributor'}
              </h3>
              <p className="text-[12px] text-ink-subtle truncate">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2 text-[12px]">
            <div className="flex items-center justify-between text-ink">
              <span className="text-ink-subtle flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                Auth Provider
              </span>
              <span className="font-medium capitalize">{authProvider}</span>
            </div>

            <div className="flex items-center justify-between text-ink">
              <span className="text-ink-subtle flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-subtle" />
                Member Since
              </span>
              <span className="font-mono tabular-nums">{creationDate}</span>
            </div>

            <div className="flex items-center justify-between text-ink">
              <span className="text-ink-subtle flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                Row Level Security
              </span>
              <span className="font-mono text-[10px] text-emerald-500 font-medium">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Synced Cloud Counts */}
        <div className="lg:col-span-2 card-71 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <div>
              <h3 className="text-[14px] font-medium text-ink-strong">Synced Cloud Data</h3>
              <p className="text-[12px] text-ink-subtle">Stored securely under your Supabase user ID</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="text-[12px] text-accent hover:text-accent-hover flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>View Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-[10px] bg-surface-2 border border-hairline space-y-1">
              <span className="text-[10px] font-medium text-ink-subtle uppercase tracking-wider block">
                PR Guide Stages
              </span>
              <div className="text-lg font-medium text-ink-strong font-mono tabular-nums">
                {cloudCounts.prSteps} / 10
              </div>
            </div>

            <div className="p-3 rounded-[10px] bg-surface-2 border border-hairline space-y-1">
              <span className="text-[10px] font-medium text-ink-subtle uppercase tracking-wider block">
                Learning Modules
              </span>
              <div className="text-lg font-medium text-ink-strong font-mono tabular-nums">
                {cloudCounts.learningModules} / 7
              </div>
            </div>

            <div className="p-3 rounded-[10px] bg-surface-2 border border-hairline space-y-1">
              <span className="text-[10px] font-medium text-ink-subtle uppercase tracking-wider block">
                Active Roadmap
              </span>
              <div className="text-lg font-medium text-ink-strong font-mono">
                {cloudCounts.hasRoadmap ? '1 Active' : 'None'}
              </div>
            </div>

            <div className="p-3 rounded-[10px] bg-surface-2 border border-hairline space-y-1">
              <span className="text-[10px] font-medium text-ink-subtle uppercase tracking-wider block">
                Saved Resources
              </span>
              <div className="text-lg font-medium text-ink-strong font-mono tabular-nums">
                {cloudCounts.savedItems}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Password Update (Only if email provider) */}
      {authProvider === 'email' && (
        <div className="card-71 p-5 sm:p-6 space-y-4">
          <div className="border-b border-hairline pb-3">
            <h3 className="text-[14px] font-medium text-ink-strong flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-accent" />
              <span>Update Password</span>
            </h3>
            <p className="text-[12px] text-ink-subtle">Change your secure account password.</p>
          </div>

          {pwdError && (
            <div className="p-3 rounded-[8px] bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[12px]">
              {pwdError}
            </div>
          )}

          {pwdSuccess && (
            <div className="p-3 rounded-[8px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[12px]">
              {pwdSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-ink-subtle block">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-8 px-3 rounded-[10px] bg-surface-2 border border-hairline text-[13px] text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:border-accent font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-medium text-ink-subtle block">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full h-8 px-3 rounded-[10px] bg-surface-2 border border-hairline text-[13px] text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:border-accent font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end pt-1">
              <button
                type="submit"
                disabled={pwdLoading}
                className="h-8 px-4 rounded-[10px] bg-accent hover:bg-accent-hover text-white text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danger Zone: Delete Cloud Progress */}
      <div className="card-71 p-5 sm:p-6 space-y-3 border-rose-500/25">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-[14px] font-medium text-rose-500 flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Cloud Progress</span>
            </h3>
            <p className="text-[12px] text-ink-subtle max-w-xl leading-relaxed">
              Permanently wipe all user_progress records associated with your account from Supabase. This action is irreversible. Your local browser progress will not be affected.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="self-start sm:self-auto h-8 px-3 rounded-[10px] bg-surface-2 hover:bg-surface text-rose-500 border border-hairline text-[12px] font-medium transition-colors cursor-pointer"
          >
            Delete Cloud Data
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md card-71 p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-500 font-medium text-[15px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Confirm Permanent Deletion</span>
            </div>

            <p className="text-[12px] text-ink-subtle leading-relaxed">
              Are you absolutely sure? This will delete all your cloud-synced PR guide stages, roadmaps, and completed lessons from the Supabase database.
            </p>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-ink-subtle">
                Type <strong className="text-rose-500 font-mono">delete</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full h-8 px-3 rounded-[10px] bg-surface-2 border border-hairline text-[13px] text-ink focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="h-8 px-3.5 rounded-[10px] bg-surface-2 text-ink text-[12px] font-medium hover:bg-surface border border-hairline cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.toLowerCase() !== 'delete' || deleteLoading}
                onClick={handleDeleteAllProgress}
                className="h-8 px-3.5 rounded-[10px] bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-medium disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
