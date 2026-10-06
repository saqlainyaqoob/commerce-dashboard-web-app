import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile, changePassword, resetSaveStatus, resetPasswordStatus } from '../features/admin/adminSlice';

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { profile, status, saveStatus, saveError, passwordStatus, passwordError } = useSelector((state) => state.admin);
  const [form, setForm] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMismatch, setPwMismatch] = useState(false);

  useEffect(() => {
    if (!profile) dispatch(fetchProfile());
  }, [dispatch, profile]);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  useEffect(() => {
    if (saveStatus === 'succeeded') {
      const t = setTimeout(() => dispatch(resetSaveStatus()), 2500);
      return () => clearTimeout(t);
    }
  }, [saveStatus, dispatch]);

  useEffect(() => {
    if (passwordStatus === 'succeeded') {
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      const t = setTimeout(() => dispatch(resetPasswordStatus()), 2500);
      return () => clearTimeout(t);
    }
  }, [passwordStatus, dispatch]);

  if (status === 'loading' || !form) {
    return <div className="dashboard-card text-sm text-slate-400 text-center py-10">Loading profile…</div>;
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    dispatch(updateProfile({
      name: form.name,
      email: form.email,
      phone: form.phone,
      avatar_url: form.avatar_url,
      timezone: form.timezone,
    }));
  }

  function handleChangePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMismatch(true);
      return;
    }
    setPwMismatch(false);
    dispatch(changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }));
  }

  return (
    <div className="max-w-2xl space-y-5">
      <form onSubmit={handleSaveProfile} className="dashboard-card space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-cyan shadow-soft flex items-center justify-center text-white text-xl font-bold overflow-hidden">
            {form.avatar_url ? <img src={form.avatar_url} alt={form.name} className="w-full h-full object-cover" /> : initialsOf(form.name)}
          </div>
          <div>
            <h3 className="font-semibold">{profile.name}</h3>
            <p className="text-xs text-slate-400">{profile.role} · Member since {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {saveStatus === 'succeeded' && (
          <div className="text-sm text-accent-green bg-accent-green/10 rounded-lg px-3 py-2">Profile updated.</div>
        )}
        {saveError && (
          <div className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">{saveError}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Phone</label>
            <input
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Avatar URL</label>
            <input
              value={form.avatar_url || ''}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://…"
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saveStatus === 'loading'}
          className="w-full bg-gradient-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-glow disabled:opacity-60"
        >
          {saveStatus === 'loading' ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="dashboard-card space-y-4">
        <h3 className="font-semibold">Change Password</h3>

        {passwordStatus === 'succeeded' && (
          <div className="text-sm text-accent-green bg-accent-green/10 rounded-lg px-3 py-2">Password changed.</div>
        )}
        {(passwordError || pwMismatch) && (
          <div className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">
            {pwMismatch ? 'New passwords do not match.' : passwordError}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase">Current Password</label>
          <input
            required
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">New Password</label>
            <input
              required
              minLength={8}
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Confirm New Password</label>
            <input
              required
              minLength={8}
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={passwordStatus === 'loading'}
          className="w-full bg-gradient-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-glow disabled:opacity-60"
        >
          {passwordStatus === 'loading' ? 'Updating…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
