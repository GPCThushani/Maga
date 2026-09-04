import { useState, type FormEvent } from 'react';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';

export const Settings = () => {
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [university, setUniversity] = useState((user as any)?.university || '');
  const [degree, setDegree] = useState((user as any)?.degree || '');
  const [gradYear, setGradYear] = useState<number | string>((user as any)?.gradYear || new Date().getFullYear());
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Software Engineering Intern');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [securityMsg, setSecurityMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      await api.put('/users/profile', {
        name,
        university,
        degree,
        gradYear: Number(gradYear),
        targetRole,
      });
      setProfileMsg({ text: 'Academic & career profile updated.', type: 'success' });
    } catch (err: any) {
      setProfileMsg({
        text: err.response?.data?.message || 'Failed to update profile.',
        type: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSecuritySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);

    if (newPassword !== confirmPassword) {
      setSecurityMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setSecurityMsg({ text: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    setSavingSecurity(true);
    try {
      await api.put('/users/change-password', {
        currentPassword,
        newPassword,
      });
      setSecurityMsg({ text: 'Password changed successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityMsg({
        text: err.response?.data?.message || 'Failed to change password.',
        type: 'error',
      });
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">Settings</h1>
        <p className="mt-1 text-sm text-textSecondary">
          Manage your academic background, target internship roles, and security credentials.
        </p>
      </div>

      {/* Academic & Profile Details */}
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary mb-4">
          Undergraduate & Role Profile
        </h2>

        {profileMsg && (
          <div
            className={`mb-4 rounded p-2.5 text-xs ${
              profileMsg.type === 'success'
                ? 'bg-success-light text-success'
                : 'bg-danger-light text-danger'
            }`}
          >
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none"
                placeholder="Software Engineering Intern"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">University / Faculty</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none"
                placeholder="e.g. Sabaragamuwa University"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Degree Program</label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none"
                placeholder="e.g. BSc Computing & IS"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Graduation Year</label>
              <input
                type="number"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-btn bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Security */}
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary mb-4">
          Change Password
        </h2>

        {securityMsg && (
          <div
            className={`mb-4 rounded p-2.5 text-xs ${
              securityMsg.type === 'success'
                ? 'bg-success-light text-success'
                : 'bg-danger-light text-danger'
            }`}
          >
            {securityMsg.text}
          </div>
        )}

        <form onSubmit={handleSecuritySubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full md:w-2/3 rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSecurity}
              className="rounded-btn border border-border px-4 py-2 text-xs font-medium text-textPrimary hover:bg-background disabled:opacity-50"
            >
              {savingSecurity ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Logout */}
      <div className="rounded-card border border-border bg-surface p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-textPrimary">Sign Out</h3>
          <p className="text-xs text-textSecondary mt-0.5">End active session on this computer.</p>
        </div>
        <button
          onClick={logout}
          className="rounded-btn border border-danger/40 bg-surface px-4 py-2 text-xs font-medium text-danger hover:bg-danger-light"
        >
          Sign Out of Maga
        </button>
      </div>
    </div>
  );
};