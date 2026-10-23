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
      <div className="max-w-2xl mx-auto space-y-6 pt-4 pb-16">
        <div className="rounded-2xl bg-gradient-to-b from-[#0c1222] to-[#070a13] border border-white/10 p-8 sm:p-10 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center text-cyan-300 mx-auto">
            <Cloud className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cross-Device Cloud Sync</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Sign In to Your Contributor Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Create an account or sign in with GitHub or Google to sync your Pull Request guide, completed Learning Center modules, and roadmaps across any computer or mobile browser.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Sign In or Register</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Continue Anonymously &rarr;
            </button>
          </div>

          <div className="pt-4 border-t border-white/5 text-[11px] text-slate-400 leading-relaxed">
            Anonymous local progress is automatically preserved in your browser's localStorage!
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
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Authenticated Contributor Profile
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Account & Sync</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage your authenticated profile and cross-device progress synchronization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-red-300 border border-white/10 hover:border-red-500/40 text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold shrink-0">
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
            ) : syncStatus === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <Cloud className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {syncStatus === 'syncing'
                  ? 'Synchronizing Progress...'
                  : syncStatus === 'error'
                  ? 'Sync Network Issue'
                  : 'Cloud Progress Synchronized'}
              </h3>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : syncStatus === 'syncing'
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {syncStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lastSyncedAt ? `Last synced today at ${lastSyncedAt}` : 'Synchronized with secure Supabase RLS'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {hasLocalToImport && (
            <button
              type="button"
              onClick={handleManualSync}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
            >
              Import Local Progress
            </button>
          )}

          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-[#080d1a] border border-cyan-500/30 text-xs text-cyan-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Profile Details & Cloud Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.email?.[0]?.toUpperCase() || 'U'
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate">
                {profile?.fullName || user.email?.split('@')[0] || 'Contributor'}
              </h3>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Auth Provider
              </span>
              <span className="font-semibold text-white capitalize">{authProvider}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Member Since
              </span>
              <span className="font-semibold text-white">{creationDate}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Row Level Security
              </span>
              <span className="font-semibold text-emerald-400 font-mono text-[10px]">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Synced Cloud Counts */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-white/10 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Synced Cloud Data</h3>
              <p className="text-xs text-slate-400">Stored securely under your Supabase user ID</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>View Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                PR Guide Stages
              </span>
              <div className="text-xl font-extrabold text-cyan-400">
                {cloudCounts.prSteps} / 10
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Learning Modules
              </span>
              <div className="text-xl font-extrabold text-purple-400">
                {cloudCounts.learningModules} / 7
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Roadmap
              </span>
              <div className="text-xl font-extrabold text-indigo-400">
                {cloudCounts.hasRoadmap ? '1 Active' : 'None'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Saved Resources
              </span>
              <div className="text-xl font-extrabold text-amber-400">
                {cloudCounts.savedItems}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Password Update (Only if email provider) */}
      {authProvider === 'email' && (
        <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-6 shadow-xl space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Update Password</span>
            </h3>
            <p className="text-xs text-slate-400">Change your secure account password.</p>
          </div>

          {pwdError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
              {pwdError}
            </div>
          )}

          {pwdSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs">
              {pwdSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={pwdLoading}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danger Zone: Delete Cloud Progress (Requirement 5) */}
      <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-red-300 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Delete Cloud Progress</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Permanently wipe all user_progress records associated with your account from Supabase. This action is irreversible. Your local browser progress will not be affected.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Delete Cloud Data
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0c1222] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center gap-2 text-red-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Confirm Permanent Deletion</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you absolutely sure? This will delete all your cloud-synced PR guide stages, roadmaps, and completed lessons from the Supabase database.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Type <strong className="text-red-400 font-mono">delete</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full bg-[#080d1a] border border-red-500/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.toLowerCase() !== 'delete' || deleteLoading}
                onClick={handleDeleteAllProgress}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
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
