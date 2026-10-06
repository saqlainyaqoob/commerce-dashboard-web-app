import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettings, resetSaveStatus } from '../features/settings/settingsSlice';
import Dropdown from '../components/Dropdown';

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Tokyo'];

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { data, status, saveStatus, saveError } = useSelector((state) => state.settings);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!data) dispatch(fetchSettings());
  }, [dispatch, data]);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  useEffect(() => {
    if (saveStatus === 'succeeded') {
      const t = setTimeout(() => dispatch(resetSaveStatus()), 2500);
      return () => clearTimeout(t);
    }
  }, [saveStatus, dispatch]);

  if (status === 'loading' || !form) {
    return <div className="dashboard-card text-sm text-slate-400 text-center py-10">Loading settings…</div>;
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    dispatch(updateSettings({
      store_name: form.store_name,
      support_email: form.support_email,
      timezone: form.timezone,
      low_stock_default_threshold: parseInt(form.low_stock_default_threshold),
      order_auto_cancel_days: parseInt(form.order_auto_cancel_days),
    }));
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="dashboard-card space-y-5">
        <div>
          <h3 className="font-semibold">Store Settings</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Saved to Postgres and applied live for every connected dashboard - e.g. the default reorder level here is used whenever a new product is added without one set.
          </p>
        </div>

        {saveStatus === 'succeeded' && (
          <div className="text-sm text-accent-green bg-accent-green/10 rounded-lg px-3 py-2">Settings saved.</div>
        )}
        {saveError && (
          <div className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">{saveError}</div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase">Store Name</label>
          <input
            required
            value={form.store_name}
            onChange={(e) => handleChange('store_name', e.target.value)}
            className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase">Support Email</label>
          <input
            type="email"
            value={form.support_email || ''}
            onChange={(e) => handleChange('support_email', e.target.value)}
            className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase">Timezone</label>
          <Dropdown
            value={form.timezone}
            onChange={(v) => handleChange('timezone', v)}
            options={TIMEZONES}
            className="mt-1 w-full"
            buttonClassName="text-sm py-2.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Default Reorder Level</label>
            <input
              type="number"
              min="0"
              value={form.low_stock_default_threshold}
              onChange={(e) => handleChange('low_stock_default_threshold', e.target.value)}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Auto-Cancel Unpaid Orders (days)</label>
            <input
              type="number"
              min="1"
              value={form.order_auto_cancel_days}
              onChange={(e) => handleChange('order_auto_cancel_days', e.target.value)}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saveStatus === 'loading'}
          className="w-full bg-gradient-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-glow disabled:opacity-60"
        >
          {saveStatus === 'loading' ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
