import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Stage } from '../pages/Applications';

interface ApplicationItem {
  _id: string;
  company: string;
  role: string;
  location: string;
  workType: string;
  stage: Stage;
  appliedDate?: string;
  matchScore?: number;
  requirements?: string[];
  notes?: string;
  deadline?: string;
}

interface ApplicationDrawerProps {
  application: ApplicationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: ApplicationItem) => void;
  onDelete: (id: string) => void;
}

const STAGES: Stage[] = ['Saved', 'Applied', 'Assessment', 'Interview', 'Decision'];

export const ApplicationDrawer = ({
  application,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ApplicationDrawerProps) => {
  const [stage, setStage] = useState<Stage>('Saved');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState('');
  const [matchScore, setMatchScore] = useState<number | undefined>(undefined);
  const [isMatching, setIsMatching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (application) {
      setStage(application.stage);
      setNotes(application.notes || '');
      setDeadline(
        application.deadline
          ? new Date(application.deadline).toISOString().split('T')[0]
          : ''
      );
      setMatchScore(application.matchScore);
    }
  }, [application]);

  if (!isOpen || !application) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.put(`/applications/${application._id}`, {
        stage,
        notes,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
      const updated = res.data.application || {
        ...application,
        stage,
        notes,
        deadline,
        matchScore,
      };
      onUpdate(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update application', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete application for ${application.company}?`)) return;
    try {
      await api.delete(`/applications/${application._id}`);
      onDelete(application._id);
      onClose();
    } catch (err) {
      console.error('Failed to delete application', err);
    }
  };

  const handleRunMatch = async () => {
    setIsMatching(true);
    try {
      const res = await api.post('/analysis/match', {
        applicationId: application._id,
        requiredSkills: application.requirements || [],
        jobRole: application.role,
      });
      if (res.data?.matchScore !== undefined) {
        setMatchScore(res.data.matchScore);
        onUpdate({ ...application, matchScore: res.data.matchScore, stage, notes, deadline });
      }
    } catch (err) {
      console.error('Match evaluation failed', err);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border shadow-xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-textSecondary font-semibold">
                Application Details
              </span>
              <button
                onClick={onClose}
                className="text-textMuted hover:text-textPrimary text-sm font-medium"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <h2 className="text-xl font-semibold text-textPrimary leading-tight">
                {application.company}
              </h2>
              <p className="text-sm text-textSecondary mt-0.5">{application.role}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-textMuted">
                <span>{application.location}</span>
                <span>·</span>
                <span>{application.workType}</span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {/* Match Fit Strip */}
            <div className="rounded-card border border-border bg-background p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-textSecondary">Skill Fit Score</span>
                <div className="text-xl font-semibold text-textPrimary mt-0.5">
                  {matchScore !== undefined ? `${matchScore}%` : 'Not computed'}
                </div>
              </div>
              <button
                onClick={handleRunMatch}
                disabled={isMatching}
                className="rounded-btn border border-border bg-surface px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-light transition-colors disabled:opacity-50"
              >
                {isMatching ? 'Evaluating...' : 'Run Fit Match'}
              </button>
            </div>

            {/* Stage Selector */}
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5">
                Current Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as Stage)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline Date */}
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5">
                Upcoming Deadline or Interview Date
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
              />
            </div>

            {/* Stated Requirements */}
            {application.requirements && application.requirements.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1.5">
                  Tracked Technical Requirements
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {application.requirements.map((req) => (
                    <span
                      key={req}
                      className="rounded bg-background border border-border px-2 py-0.5 text-xs text-textPrimary font-medium"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Field */}
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5">
                Interview Prep & Opportunity Notes
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention recruiter contacts, assignment instructions, or topics to prepare..."
                className="w-full rounded-input border border-border bg-surface p-3 text-sm text-textPrimary placeholder:text-textMuted focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-6 border-t border-border flex items-center justify-between bg-surface">
            <button
              onClick={handleDelete}
              type="button"
              className="text-xs text-danger hover:underline font-medium"
            >
              Delete Record
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                type="button"
                className="rounded-btn border border-border px-3.5 py-1.5 text-xs font-medium text-textSecondary hover:bg-background"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                type="button"
                className="rounded-btn bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};