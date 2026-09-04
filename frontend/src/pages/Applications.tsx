import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ApplicationDrawer } from '../components/ApplicationDrawer';
import { AddApplicationModal } from '../components/AddApplicationModal';

export type Stage = 'Saved' | 'Applied' | 'Assessment' | 'Interview' | 'Decision';

export interface ApplicationItem {
  _id: string;
  company: string;
  role: string;
  location: string;
  workType: string;
  stage: Stage;
  appliedDate?: string;
  matchScore?: number;
  source?: string;
  requirements?: string[];
  notes?: string;
  deadline?: string;
}

const STAGES: Stage[] = ['Saved', 'Applied', 'Assessment', 'Interview', 'Decision'];

const MOCK_APPLICATIONS: ApplicationItem[] = [
  { _id: '1', company: 'Sysco LABS', role: 'Associate Software Engineer Intern', location: 'Colombo', workType: 'Hybrid', stage: 'Interview', matchScore: 85, requirements: ['React', 'Node.js', 'AWS'] },
  { _id: '2', company: 'WSO2', role: 'Software Engineering Intern', location: 'Colombo', workType: 'Hybrid', stage: 'Assessment', matchScore: 92, requirements: ['Java', 'Docker', 'Kubernetes'] },
  { _id: '3', company: 'Virtusa', role: 'Full Stack Intern', location: 'Colombo', workType: 'On-site', stage: 'Applied', matchScore: 78, requirements: ['React', 'Node.js', 'MongoDB'] },
  { _id: '4', company: 'IFS', role: 'Software Engineering Intern', location: 'Colombo', workType: 'Hybrid', stage: 'Saved', matchScore: 70, requirements: ['C#', '.NET', 'SQL'] },
  { _id: '5', company: '99x', role: 'Trainee Software Engineer', location: 'Colombo', workType: 'Hybrid', stage: 'Decision', matchScore: 88, requirements: ['TypeScript', 'React', 'Node.js'] },
];

export const Applications = () => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [apps, setApps] = useState<ApplicationItem[]>(MOCK_APPLICATIONS);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get('/applications');
        if (res.data?.applications && res.data.applications.length > 0) {
          setApps(res.data.applications);
        }
      } catch (err) {
        // Retain benchmark mock data if offline or unseeded
      }
    };
    fetchApps();
  }, []);

  const handleStageChange = async (id: string, nextStage: Stage) => {
    setApps((prev) =>
      prev.map((app) => (app._id === id ? { ...app, stage: nextStage } : app))
    );
    try {
      await api.patch(`/applications/${id}/stage`, { stage: nextStage });
    } catch (err) {
      console.error('Failed to update stage on server', err);
    }
  };

  const handleOpenDetails = (app: ApplicationItem) => {
    setSelectedApp(app);
    setIsDrawerOpen(true);
  };

  const filteredApps = apps.filter((item) => {
    const matchesSearch =
      item.company.toLowerCase().includes(search.toLowerCase()) ||
      item.role.toLowerCase().includes(search.toLowerCase());
    const matchesStage = filterStage === 'All' || item.stage === filterStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">Applications</h1>
          <p className="mt-0.5 text-sm text-textSecondary">
            Manage your recruitment pipeline across {apps.length} active opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-btn bg-accent px-3.5 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors"
          >
            + Add Opportunity
          </button>

          {/* View Toggle */}
          <div className="flex rounded-btn border border-border bg-surface p-0.5 text-xs">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-btn font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-background text-textPrimary font-semibold shadow-xs'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Pipeline Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-btn font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-background text-textPrimary font-semibold shadow-xs'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Filter by company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-input border border-border bg-surface px-3 py-1.5 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
        />
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="rounded-input border border-border bg-surface px-3 py-1.5 text-sm text-textSecondary focus:outline-none focus:border-accent"
        >
          <option value="All">All Stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Board (Kanban) View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {STAGES.map((stage) => {
            const stageApps = filteredApps.filter((a) => a.stage === stage);
            return (
              <div key={stage} className="rounded-card border border-border bg-surface/60 p-3">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
                    {stage}
                  </span>
                  <span className="text-xs font-semibold text-textMuted bg-background px-1.5 py-0.5 rounded">
                    {stageApps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {stageApps.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleOpenDetails(item)}
                      className="cursor-pointer rounded-btn border border-border bg-surface p-3 shadow-xs hover:border-textSecondary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-medium text-sm text-textPrimary leading-tight">
                          {item.company}
                        </div>
                        {item.matchScore !== undefined && (
                          <span className="text-[11px] font-semibold text-accent bg-accent-light px-1.5 py-0.5 rounded">
                            {item.matchScore}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-textSecondary mt-1 leading-snug">{item.role}</div>
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/60 text-[11px] text-textMuted">
                        <span>{item.workType}</span>
                        <span>·</span>
                        <span>{item.location}</span>
                      </div>

                      {/* Stage Selector (click propagation stopped) */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]"
                      >
                        <span className="text-textMuted">Move:</span>
                        <select
                          value={item.stage}
                          onChange={(e) => handleStageChange(item._id, e.target.value as Stage)}
                          className="bg-background border border-border rounded px-1.5 py-0.5 text-textSecondary text-[11px]"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stageApps.length === 0 && (
                    <div className="py-6 text-center text-xs text-textMuted border border-dashed border-border rounded-btn">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-card border border-border bg-surface overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase tracking-wider text-textSecondary font-semibold">
              <tr>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Location / Type</th>
                <th className="px-6 py-3">Match</th>
                <th className="px-6 py-3">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredApps.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => handleOpenDetails(item)}
                  className="cursor-pointer hover:bg-background/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-textPrimary">{item.company}</td>
                  <td className="px-6 py-4 text-textSecondary">{item.role}</td>
                  <td className="px-6 py-4 text-xs text-textMuted">{item.location} · {item.workType}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-0.5 rounded">
                      {item.matchScore !== undefined ? `${item.matchScore}%` : '--'}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={item.stage}
                      onChange={(e) => handleStageChange(item._id, e.target.value as Stage)}
                      className="bg-background border border-border rounded px-2 py-1 text-xs text-textSecondary font-medium"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Opportunity Modal */}
      <AddApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newApp: ApplicationItem) => setApps((prev) => [newApp, ...prev])}
      />

      {/* Slide-over Details Drawer */}
      <ApplicationDrawer
        application={selectedApp}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedApp(null);
        }}
        onUpdate={(updated) => {
          setApps((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
        }}
        onDelete={(id) => {
          setApps((prev) => prev.filter((a) => a._id !== id));
        }}
      />
    </div>
  );
};