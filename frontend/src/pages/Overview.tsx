import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface OverviewProps {
  onNavigate?: (screen: string) => void;
}

interface DashboardMetrics {
  totalApplications: number;
  activeInterviews: number;
  activeAssessments: number;
}

export const Overview = ({ onNavigate }: OverviewProps) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApplications: 12,
    activeInterviews: 3,
    activeAssessments: 4,
  });
  const [pipeline, setPipeline] = useState<Record<string, number>>({
    Saved: 8,
    Applied: 5,
    Assessment: 4,
    Interview: 3,
    Decision: 1,
  });
  const [userName, setUserName] = useState('Thushani');

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/analytics/overview');
        if (res.data) {
          if (res.data.user?.name) setUserName(res.data.user.name);
          if (res.data.metrics) setMetrics(res.data.metrics);
          if (res.data.pipeline) setPipeline(res.data.pipeline);
        }
      } catch (err) {
        // Retains Figma benchmark defaults if server is not connected yet
      }
    };
    fetchOverview();
  }, []);

  const pipelineStages = [
    { label: 'Saved', count: pipeline.Saved ?? 8 },
    { label: 'Applied', count: pipeline.Applied ?? 5 },
    { label: 'Assessment', count: pipeline.Assessment ?? 4 },
    { label: 'Interview', count: pipeline.Interview ?? 3 },
    { label: 'Decision', count: pipeline.Decision ?? 1 },
  ];

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Editorial Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
          Good morning, {userName}
        </h1>
        <p className="mt-1 text-sm text-textSecondary">
          Track opportunities, prepare applications, and understand where you can improve.
        </p>
      </div>

      {/* Primary Metrics Summary */}
      <div className="flex items-center gap-6 border-y border-border py-4 text-sm">
        <div>
          <span className="font-semibold text-textPrimary">{metrics.totalApplications}</span>{' '}
          <span className="text-textSecondary">active applications</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="font-semibold text-textPrimary">{metrics.activeInterviews}</span>{' '}
          <span className="text-textSecondary">interviews scheduled</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="font-semibold text-textPrimary">{metrics.activeAssessments}</span>{' '}
          <span className="text-textSecondary">pending assessments</span>
        </div>
      </div>

      {/* Application Pipeline Strip */}
      <div className="rounded-card border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Application Pipeline
          </h2>
          <button
            onClick={() => onNavigate && onNavigate('applications')}
            className="text-xs font-medium text-accent hover:underline"
          >
            View all
          </button>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2 divide-x divide-border text-center">
          {pipelineStages.map((stage, idx) => (
            <div key={stage.label} className={idx !== 0 ? 'pl-2' : ''}>
              <div className="text-xs text-textSecondary">{stage.label}</div>
              <div className="mt-1 text-2xl font-semibold text-textPrimary">{stage.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Deadlines & Career Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="rounded-card border border-border bg-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Upcoming Deadlines
          </h2>
          <div className="mt-4 divide-y divide-border text-sm">
            <div className="py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-textPrimary">Frontend Intern</span>
                <span className="rounded bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
                  Sep 8
                </span>
              </div>
              <div className="text-xs text-textSecondary mt-0.5">ABC Company · Application deadline</div>
            </div>

            <div className="py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-textPrimary">Software Engineering Intern</span>
                <span className="rounded bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
                  Sep 10
                </span>
              </div>
              <div className="text-xs text-textSecondary mt-0.5">Virtusa · Technical Assessment</div>
            </div>
          </div>
        </div>

        {/* Career Insight Card */}
        <div className="rounded-card border border-border bg-surface p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
              Career Insight
            </h2>
            <div className="mt-4">
              <div className="text-3xl font-semibold text-textPrimary">78%</div>
              <p className="mt-1 text-xs text-textSecondary">
                Your profile matches 78% of the core requirements for Full Stack Developer internships.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="rounded bg-background px-2 py-1 text-xs text-textPrimary border border-border">
                ✓ React
              </span>
              <span className="rounded bg-background px-2 py-1 text-xs text-textPrimary border border-border">
                ✓ Node.js
              </span>
              <span className="rounded bg-background px-2 py-1 text-xs text-textPrimary border border-border">
                ✓ MongoDB
              </span>
              <span className="rounded bg-danger-light px-2 py-1 text-xs text-danger">
                ! Docker
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('career-analysis')}
            className="mt-6 w-full rounded-btn border border-border py-2 text-center text-xs font-medium text-textPrimary hover:bg-background transition-colors"
          >
            View Career Analysis
          </button>
        </div>
      </div>
    </div>
  );
};