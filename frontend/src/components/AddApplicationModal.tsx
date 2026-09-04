import { useState, type FormEvent } from 'react';
import { api } from '../services/api';
import type { Stage } from '../pages/Applications';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newApp: any) => void;
}

const WORK_TYPES = ['Hybrid', 'On-site', 'Remote'];

export const AddApplicationModal = ({
  isOpen,
  onClose,
  onCreated,
}: AddApplicationModalProps) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('Colombo');
  const [workType, setWorkType] = useState('Hybrid');
  const [stage, setStage] = useState<Stage>('Saved');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const requirements = requirementsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.post('/applications', {
        company,
        role,
        location,
        workType,
        stage,
        requirements,
      });

      onCreated(res.data.application || res.data);
      onClose();
      // Reset form
      setCompany('');
      setRole('');
      setRequirementsInput('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-modal border border-border bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold text-textPrimary">Add Opportunity</h2>
          <button
            onClick={onClose}
            className="text-sm text-textMuted hover:text-textPrimary"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded bg-danger-light p-2 text-xs text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Company</label>
            <input
              type="text"
              required
              placeholder="e.g. WSO2, Sysco LABS"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-1.5 text-textPrimary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Role</label>
            <input
              type="text"
              required
              placeholder="e.g. Software Engineering Intern"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-1.5 text-textPrimary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-1.5 text-textPrimary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Work Type</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-2 py-1.5 text-textPrimary focus:border-accent focus:outline-none"
              >
                {WORK_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Initial Pipeline Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
              className="w-full rounded-input border border-border bg-surface px-2 py-1.5 text-textPrimary focus:border-accent focus:outline-none"
            >
              <option value="Saved">Saved</option>
              <option value="Applied">Applied</option>
              <option value="Assessment">Assessment</option>
              <option value="Interview">Interview</option>
              <option value="Decision">Decision</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">
              Required Technical Skills (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="React, Node.js, Docker, SQL"
              value={requirementsInput}
              onChange={(e) => setRequirementsInput(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-1.5 text-textPrimary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-btn border border-border px-3 py-1.5 text-xs font-medium text-textSecondary hover:bg-background"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-btn bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};