import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';

export const Settings = () => {
  const { user, logout } = useAuth();
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState(user?.name || '');
  const [university, setUniversity] = useState((user as any)?.university || '');
  const [faculty, setFaculty] = useState((user as any)?.faculty || '');
  const [degree, setDegree] = useState((user as any)?.degree || '');
  const [gradYear, setGradYear] = useState<number | string>(
    (user as any)?.gradYear || currentYear + 1
  );
  const [targetRole, setTargetRole] = useState(
    user?.targetRole || 'Software Engineering Intern'
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [securityMsg, setSecurityMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Synchronize state when user finishes loading from AuthContext
  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setUniversity((user as any).university || '');
    setFaculty((user as any).faculty || '');
    setDegree((user as any).degree || '');
    setGradYear((user as any).gradYear || new Date().getFullYear() + 1);
    setTargetRole(user.targetRole || 'Software Engineering Intern');
  }, [user]);

  // Profile Completeness Calculation scoped strictly to the 6 fields managed here
  const profileFields = [
    name.trim(),
    targetRole.trim(),
    university.trim(),
    faculty.trim(),
    degree.trim(),
    gradYear,
  ];
  const filledFieldsCount = profileFields.filter(Boolean).length;
  const completenessPct = Math.round((filledFieldsCount / profileFields.length) * 100);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      await api.put('/users/profile', {
        name: name.trim(),
        university: university.trim(),
        faculty: faculty.trim(),
        degree: degree.trim(),
        gradYear: Number(gradYear),
        targetRole: targetRole.trim(),
      });
      setProfileMsg({
        text: 'Profile and career preferences updated.',
        type: 'success',
      });
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
      setSecurityMsg({
        text: 'Password must be at least 6 characters long.',
        type: 'error',
      });
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
          Settings
        </h1>
        <p className="mt-1 text-sm text-textSecondary">
          Manage your personal information, academic background, career preferences, and account security.
        </p>
      </div>

      {/* Profile & Career Section */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
              Profile & Career
            </h2>
            <p className="text-xs text-textMuted mt-0.5">
              Personal, university, and role settings used across CareerTrack.
            </p>
          </div>

          {/* Profile Completeness Label & Value */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-textMuted">
              Profile completeness
            </span>
            <span className="text-xs font-semibold text-textPrimary">
              {completenessPct}%
            </span>
          </div>
        </div>

        {/* Stable Accent Progress Bar */}
        <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border/40 -mt-2">
          <div
            className="h-1.5 rounded-full bg-accent transition-all duration-300"
            style={{ width: `${completenessPct}%` }}
          />
        </div>

        {profileMsg && (
          <div
            className={`rounded p-2.5 text-xs ${
              profileMsg.type === 'success'
                ? 'bg-success-light text-success'
                : 'bg-danger-light text-danger'
            }`}
          >
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-6 text-sm">
          {/* Group 1: Personal & Career Preference */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider block">
              Personal & Target Track
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                  placeholder="e.g. ABC Perera"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                  placeholder="e.g. Full Stack Developer Intern"
                />
              </div>
            </div>
          </div>

          {/* Group 2: Academic Background */}
          <div className="space-y-3 pt-2 border-t border-border">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider block">
              Academic Background
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  University
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                  placeholder="e.g. Sabaragamuwa University of Sri Lanka"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Faculty / Department
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                  placeholder="e.g. Faculty of Computing"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Degree Program
                </label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                  placeholder="e.g. BSc (Hons) in Software Engineering"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Expected Graduation
                </label>
                <input
                  type="number"
                  min={currentYear}
                  max={currentYear + 8}
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-btn bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Section */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-4">
        <div className="border-b border-border pb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Account Security
          </h2>
          <p className="text-xs text-textMuted mt-0.5">
            Update your account password to protect access.
          </p>
        </div>

        {securityMsg && (
          <div
            className={`rounded p-2.5 text-xs ${
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
            <label className="block text-xs font-medium text-textSecondary mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full md:w-2/3 rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                placeholder="••••••••"
              />
              <span className="block text-[11px] text-textMuted mt-1">
                Must be at least 6 characters long.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSecurity}
              className="rounded-btn border border-border bg-background px-4 py-2 text-xs font-medium text-textPrimary hover:bg-surface transition-colors disabled:opacity-50"
            >
              {savingSecurity ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account / Session Sign Out */}
      <div className="rounded-card border border-border bg-surface p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-textPrimary">Sign Out</h3>
          <p className="text-xs text-textSecondary mt-0.5">
            End your active CareerTrack session on this device.
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-btn border border-border bg-background px-4 py-2 text-xs font-medium text-textSecondary hover:text-danger hover:border-danger/40 transition-colors self-start sm:self-auto"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};