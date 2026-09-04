import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

interface OverviewProps {
  onNavigate?: (screen: string) => void;
}

interface DashboardMetrics {
  totalApplications: number;
  activeInterviews: number;
  activeAssessments: number;
}

interface DeadlineItem {
  id: string;
  role: string;
  company: string;
  type: string;
  date: string;
}

interface CareerInsight {
  matchPercentage: number;
  targetRole: string;
  matchedSkills: string[];
  missingSkills: string[];
}

interface OverviewData {
  metrics: DashboardMetrics;
  pipeline: Record<string, number>;
  deadlines: DeadlineItem[];
  careerInsight: CareerInsight | null;
}

export const Overview = ({ onNavigate }: OverviewProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApplications: 0,
    activeInterviews: 0,
    activeAssessments: 0,
  });
  const [pipeline, setPipeline] = useState<Record<string, number>>({
    Saved: 0,
    Applied: 0,
    Assessment: 0,
    Interview: 0,
    Decision: 0,
  });
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [insight, setInsight] = useState<CareerInsight | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await api.get<OverviewData>('/analytics/overview');
        if (res.data && isMounted) {
          if (res.data.metrics) {
            setMetrics({
              totalApplications: res.data.metrics.totalApplications ?? 0,
              activeInterviews: res.data.metrics.activeInterviews ?? 0,
              activeAssessments: res.data.metrics.activeAssessments ?? 0,
            });
          }
          if (res.data.pipeline) {
            setPipeline(res.data.pipeline);
          }
          if (Array.isArray(res.data.deadlines)) {
            setDeadlines(res.data.deadlines);
          }
          if (res.data.careerInsight) {
            setInsight(res.data.careerInsight);
          }
        }
      } catch (err) {
        console.error('Failed to fetch overview metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOverview();
    return () => {
      isMounted = false;
    };
  }, []);

  const pipelineStages = [
    { label: 'Saved', count: pipeline.Saved ?? 0 },
    { label: 'Applied', count: pipeline.Applied ?? 0 },
    { label: 'Assessment', count: pipeline.Assessment ?? 0 },
    { label: 'Interview', count: pipeline.Interview ?? 0 },
    { label: 'Decision', count: pipeline.Decision ?? 0 },
  ];

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Editorial Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
          Good morning, {user?.name || 'User'}
        </h1>
        <p className="mt-1 text-sm text-textSecondary">
          Track opportunities, prepare applications, and understand where you can improve.
        </p>
      </div>

      {/* Primary Metrics Summary */}
      <div className="flex items-center gap-6 border-y border-border py-4 text-sm">
        <div>
          <span className="font-semibold text-textPrimary">
            {loading ? '-' : metrics.totalApplications}
          </span>{' '}
          <span className="text-textSecondary">active applications</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="font-semibold text-textPrimary">
            {loading ? '-' : metrics.activeInterviews}
          </span>{' '}
          <span className="text-textSecondary">interviews scheduled</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="font-semibold text-textPrimary">
            {loading ? '-' : metrics.activeAssessments}
          </span>{' '}
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
            type="button"
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
              <div className="mt-1 text-2xl font-semibold text-textPrimary">
                {loading ? '-' : stage.count}
              </div>
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

          {loading ? (
            <div className="mt-4 space-y-3">
              <div className="h-10 rounded bg-background animate-pulse" />
              <div className="h-10 rounded bg-background animate-pulse" />
            </div>
          ) : deadlines.length === 0 ? (
            <div className="mt-6 py-6 text-center">
              <p className="text-xs text-textSecondary">No upcoming deadlines found.</p>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('applications')}
                className="mt-2 text-xs font-medium text-accent hover:underline"
              >
                Track a new application
              </button>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border text-sm">
              {deadlines.map((item) => (
                <div key={item.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-textPrimary">{item.role}</span>
                    <span className="rounded bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
                      {item.date}
                    </span>
                  </div>
                  <div className="text-xs text-textSecondary mt-0.5">
                    {item.company} · {item.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Career Insight Card */}
        <div className="rounded-card border border-border bg-surface p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
              Career Insight
            </h2>

            {loading ? (
              <div className="mt-4 space-y-2">
                <div className="h-8 w-16 rounded bg-background animate-pulse" />
                <div className="h-4 w-full rounded bg-background animate-pulse" />
              </div>
            ) : insight ? (
              <div className="mt-4">
                <div className="text-3xl font-semibold text-textPrimary">
                  {insight.matchPercentage}%
                </div>
                <p className="mt-1 text-xs text-textSecondary">
                  Your profile matches {insight.matchPercentage}% of the core requirements for{' '}
                  {insight.targetRole || 'your target role'}.
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {insight.matchedSkills?.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-background px-2 py-1 text-xs text-textPrimary border border-border"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                  {insight.missingSkills?.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-danger-light px-2 py-1 text-xs text-danger"
                    >
                      ! {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 py-6 text-center">
                <p className="text-xs text-textSecondary">
                  Upload your CV to compute profile match metrics.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('cv-profile')}
                  className="mt-2 text-xs font-medium text-accent hover:underline"
                >
                  Upload CV & Profile
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
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