import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FunnelData {
  totalTracked: number;
  savedOpportunities: number;
  submittedApplications: number;
  assessments: number;
  interviews: number;
  offers: number;
}

interface OutcomesData {
  Active: number;
  Offer: number;
  Rejected: number;
  Ghosted: number;
}

interface SkillCount {
  name: string;
  count: number;
  percentage: number;
  inProfile: boolean;
}

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [staleCount, setStaleCount] = useState(0);

  const [funnel, setFunnel] = useState<FunnelData>({
    totalTracked: 0,
    savedOpportunities: 0,
    submittedApplications: 0,
    assessments: 0,
    interviews: 0,
    offers: 0,
  });

  const [outcomes, setOutcomes] = useState<OutcomesData>({
    Active: 0,
    Offer: 0,
    Rejected: 0,
    Ghosted: 0,
  });

  const [topSkills, setTopSkills] = useState<SkillCount[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/overview');
        if (res.data) {
          if (res.data.funnel) {
            setFunnel(res.data.funnel);
          }
          if (res.data.outcomes) {
            setOutcomes(res.data.outcomes);
          }
          if (typeof res.data.staleCount === 'number') {
            setStaleCount(res.data.staleCount);
          }

          if (Array.isArray(res.data.topRequestedSkills)) {
            setTopSkills(
              res.data.topRequestedSkills.map((s: { skill: string; count: number; percentage: number; inProfile: boolean }) => ({
                name: s.skill,
                count: s.count,
                percentage: s.percentage,
                inProfile: Boolean(s.inProfile),
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to retrieve application analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Conversion rates calculated strictly against submitted applications
  const interviewRate =
    funnel.submittedApplications > 0
      ? Math.round((funnel.interviews / funnel.submittedApplications) * 100)
      : 0;

  const assessmentRate =
    funnel.submittedApplications > 0
      ? Math.round((funnel.assessments / funnel.submittedApplications) * 100)
      : 0;

  const offerRate =
    funnel.submittedApplications > 0
      ? Math.round((funnel.offers / funnel.submittedApplications) * 100)
      : 0;

  const navigateTo = (path: string) => {
    window.location.assign(path);
  };

  const topGapSkill = topSkills.find((s) => !s.inProfile);

  if (loading) {
    return (
      <div className="py-24 text-center border border-border rounded-card bg-surface">
        <p className="text-sm text-textSecondary">Calculating application pipeline analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">Application Analytics</h1>
        <p className="mt-0.5 text-sm text-textSecondary">
          Understand how your applications are progressing, where your pipeline slows down, and which skills appear most often in your target roles.
        </p>
      </div>

      {/* Subtle Inactive Application Notification */}
      {staleCount > 0 && (
        <div className="rounded-card border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 flex items-center justify-between gap-2">
          <span>
            {staleCount} application{staleCount > 1 ? 's have' : ' has'} been awaiting a response for more than 14 days.
          </span>
          <button
            onClick={() => navigateTo('/applications')}
            className="underline font-semibold hover:text-amber-950 shrink-0"
          >
            Review pipeline →
          </button>
        </div>
      )}

      {funnel.totalTracked === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-12 text-center space-y-3">
          <h3 className="text-base font-semibold text-textPrimary">No Pipeline Activity Logged</h3>
          <p className="text-xs text-textMuted max-w-sm mx-auto">
            Add internship opportunities and track application stages to unlock quantitative conversion analytics.
          </p>
          <button
            onClick={() => navigateTo('/applications')}
            className="rounded-btn bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors mt-2"
          >
            Track Your First Opportunity
          </button>
        </div>
      ) : (
        <>
          {/* Precise KPI Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-card border border-border bg-surface p-5">
              <span className="text-xs uppercase tracking-wider text-textSecondary font-semibold">
                Interview Rate
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-textPrimary">{interviewRate}%</span>
                <span className="text-xs text-textMuted">Submitted → Interview</span>
              </div>
              <div className="mt-3 w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div className="bg-accent h-1.5 rounded-full" style={{ width: `${interviewRate}%` }} />
              </div>
            </div>

            <div className="rounded-card border border-border bg-surface p-5">
              <span className="text-xs uppercase tracking-wider text-textSecondary font-semibold">
                Assessment Rate
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-textPrimary">{assessmentRate}%</span>
                <span className="text-xs text-textMuted">Submitted → Assessment</span>
              </div>
              <div className="mt-3 w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${assessmentRate}%` }} />
              </div>
            </div>

            <div className="rounded-card border border-border bg-surface p-5">
              <span className="text-xs uppercase tracking-wider text-textSecondary font-semibold">
                Offer Rate
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-textPrimary">{offerRate}%</span>
                <span className="text-xs text-textMuted">Submitted → Offer</span>
              </div>
              <div className="mt-3 w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${offerRate}%` }} />
              </div>
            </div>
          </div>

          {/* Application Funnel (Raw counts only to prevent competing percentage confusion) */}
          <div className="rounded-card border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
                Application Funnel
              </h2>
              <span className="text-xs text-textMuted">{funnel.totalTracked} Total Logged</span>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Saved opportunities', count: funnel.savedOpportunities, color: 'bg-textSecondary' },
                { label: 'Applications submitted', count: funnel.submittedApplications, color: 'bg-accent' },
                { label: 'Assessments', count: funnel.assessments, color: 'bg-amber-500' },
                { label: 'Interviews', count: funnel.interviews, color: 'bg-accent' },
                { label: 'Offers received', count: funnel.offers, color: 'bg-emerald-600' },
              ].map((stage) => {
                const relativeWidth =
                  funnel.totalTracked > 0 ? Math.round((stage.count / funnel.totalTracked) * 100) : 0;
                return (
                  <div key={stage.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-textPrimary font-medium">{stage.label}</span>
                      <span className="text-textSecondary font-medium">{stage.count}</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/40">
                      <div
                        className={`${stage.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${relativeWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Application Outcomes */}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="text-textMuted font-medium uppercase tracking-wider">Outcomes</span>
              <div className="flex items-center gap-5">
                <span className="text-textSecondary">
                  Active <strong className="text-textPrimary ml-1 font-semibold">{outcomes.Active}</strong>
                </span>
                <span className="text-textSecondary">
                  Offers <strong className="text-emerald-700 ml-1 font-semibold">{outcomes.Offer}</strong>
                </span>
                <span className="text-textSecondary">
                  Rejected <strong className="text-rose-700 ml-1 font-semibold">{outcomes.Rejected}</strong>
                </span>
                <span className="text-textSecondary">
                  No response <strong className="text-textMuted ml-1 font-semibold">{outcomes.Ghosted}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Skills in Your Target Roles */}
          <div className="rounded-card border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
                  Skills in Your Target Roles
                </h2>
                <p className="text-xs text-textMuted mt-0.5">
                  Technologies repeatedly demanded across your tracked job descriptions.
                </p>
              </div>
              <button
                onClick={() => navigateTo('/career-analysis')}
                className="text-xs text-accent hover:underline font-medium"
              >
                Career analysis →
              </button>
            </div>

            {topSkills.length === 0 ? (
              <p className="text-xs text-textMuted italic py-4 text-center">
                Add technical requirements to your tracked applications to populate skill frequencies.
              </p>
            ) : (
              <div className="space-y-3 pt-2">
                {topSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between gap-4 text-xs">
                    <div className="w-36 flex items-center gap-1.5">
                      <span className="font-medium text-textPrimary truncate">{skill.name}</span>
                      {skill.inProfile ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                          ✓ Profile
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                          Skill gap
                        </span>
                      )}
                    </div>

                    <div className="flex-1 bg-background rounded-full h-2 overflow-hidden border border-border/40">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          skill.inProfile ? 'bg-accent' : 'bg-amber-500'
                        }`}
                        style={{ width: `${skill.percentage}%` }}
                      />
                    </div>

                    <div className="w-20 text-right text-textSecondary font-medium">
                      {skill.count} job{skill.count > 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Next Steps */}
          <div className="rounded-card border border-border bg-surface p-6 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
              Recommended Next Steps
            </h2>
            <div className="space-y-2 pt-1 text-xs">
              {topGapSkill && (
                <div className="flex items-center justify-between p-3 rounded-card bg-background/50 border border-border/60">
                  <span className="text-textSecondary">
                    <strong className="text-textPrimary font-semibold">{topGapSkill.name}</strong> appears in {topGapSkill.count} of your target roles but is not listed in your profile.
                  </span>
                  <button
                    onClick={() => navigateTo('/career-analysis')}
                    className="text-accent hover:underline font-semibold shrink-0 ml-3"
                  >
                    View skill gap →
                  </button>
                </div>
              )}

              {staleCount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-card bg-background/50 border border-border/60">
                  <span className="text-textSecondary">
                    {staleCount} application{staleCount > 1 ? 's have' : ' has'} had no stage updates in over two weeks. Send a polite status follow-up.
                  </span>
                  <button
                    onClick={() => navigateTo('/applications')}
                    className="text-accent hover:underline font-semibold shrink-0 ml-3"
                  >
                    Review pipeline →
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-card bg-background/50 border border-border/60">
                <span className="text-textSecondary">
                  Benchmark your profile skills against standard regional tech tracks to identify high-ROI competencies.
                </span>
                <button
                  onClick={() => navigateTo('/career-analysis')}
                  className="text-accent hover:underline font-semibold shrink-0 ml-3"
                >
                  Explore career tracks →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};