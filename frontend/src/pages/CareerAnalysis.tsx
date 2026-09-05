import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface TrackedApplication {
  _id: string;
  company: string;
  role: string;
  requirements?: string[];
  matchScore?: number;
}

interface ActionStep {
  title: string;
  action: string;
  tags?: string[];
}

interface AnalysisResult {
  matchScore: number;
  matchedRequirements: string;
  matchedSkills: string[];
  missingSkills: string[];
  actionPlan: ActionStep[];
}

const CAREER_TRACKS: Record<string, string[]> = {
  'Full Stack Development': [
    'React', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'Git', 'REST APIs', 'Docker'
  ],
  'Frontend Engineering': [
    'React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Git', 'Redux'
  ],
  'Backend Engineering': [
    'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'REST APIs', 'Docker', 'Git', 'Unit Testing'
  ],
  'Quality Assurance & Testing': [
    'Manual Testing', 'Selenium', 'Postman', 'Jira', 'Agile', 'SQL', 'Git'
  ],
  'Data Analytics': [
    'Python', 'SQL', 'Excel', 'Data Visualization', 'Pandas', 'PowerBI'
  ],
  'Mobile Development': [
    'Flutter', 'React Native', 'Dart', 'REST APIs', 'Git', 'Firebase'
  ],
  'UI/UX Design': [
    'Figma', 'Wireframing', 'User Research', 'Prototyping', 'Design Systems'
  ],
};

export const CareerAnalysis = () => {
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [evalMode, setEvalMode] = useState<'track' | 'application'>('track');
  const [selectedTrack, setSelectedTrack] = useState<string>('Full Stack Development');
  const [selectedAppId, setSelectedAppId] = useState<string>('');

  const [roleTitle, setRoleTitle] = useState('Full Stack Development');
  const [requirements, setRequirements] = useState<string[]>(CAREER_TRACKS['Full Stack Development']);
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [manualSkillsInput, setManualSkillsInput] = useState(CAREER_TRACKS['Full Stack Development'].join(', '));

  const [analyzing, setAnalyzing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [addingSkill, setAddingSkill] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Guard against race conditions when switching roles rapidly
  const activeAbortController = useRef<AbortController | null>(null);

  const runAnalysis = async (
    targetRole: string,
    reqSkills: string[],
    appId?: string
  ) => {
    if (!targetRole.trim() || reqSkills.length === 0) {
      setAnalysisResult(null);
      return;
    }

    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    const controller = new AbortController();
    activeAbortController.current = controller;

    setAnalyzing(true);
    setFeedbackMessage('');

    try {
      const payload: {
        jobRole: string;
        requiredSkills: string[];
        applicationId?: string;
      } = {
        jobRole: targetRole.trim(),
        requiredSkills: reqSkills,
      };

      if (appId) payload.applicationId = appId;

      const res = await api.post('/analysis/match', payload, {
        signal: controller.signal,
      });

      if (res.data) {
        setAnalysisResult(res.data);
        if (appId) {
          setApplications((prev) =>
            prev.map((a) => (a._id === appId ? { ...a, matchScore: res.data.matchScore } : a))
          );
        }
      }
    } catch (err: any) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setFeedbackMessage(err.response?.data?.message || 'Failed to calculate alignment.');
      }
    } finally {
      if (activeAbortController.current === controller) {
        setAnalyzing(false);
      }
    }
  };

  // Initial load: Profile preferences and applications
  useEffect(() => {
    const loadContext = async () => {
      try {
        const [profileRes, appsRes] = await Promise.all([
          api.get('/users/profile'),
          api.get('/applications'),
        ]);

        if (appsRes.data?.applications) {
          setApplications(appsRes.data.applications);
        }

        const userTarget = profileRes.data?.user?.targetRole;
        if (userTarget && CAREER_TRACKS[userTarget]) {
          setSelectedTrack(userTarget);
          setRoleTitle(userTarget);
          setRequirements(CAREER_TRACKS[userTarget]);
          setManualSkillsInput(CAREER_TRACKS[userTarget].join(', '));
          runAnalysis(userTarget, CAREER_TRACKS[userTarget]);
        } else {
          runAnalysis('Full Stack Development', CAREER_TRACKS['Full Stack Development']);
        }
      } catch (err) {
        console.error('Failed to load initial analysis context:', err);
      }
    };

    loadContext();

    return () => {
      if (activeAbortController.current) {
        activeAbortController.current.abort();
      }
    };
  }, []);

  // Switch career track direction
  const handleSelectTrack = (trackName: string) => {
    setSelectedTrack(trackName);
    setRoleTitle(trackName);
    const skills = CAREER_TRACKS[trackName] || [];
    setRequirements(skills);
    setManualSkillsInput(skills.join(', '));
    runAnalysis(trackName, skills);
  };

  // Switch to a specific tracked application with strict fallback handling
  const handleSelectApp = (appId: string) => {
    setSelectedAppId(appId);
    if (!appId) {
      setAnalysisResult(null);
      return;
    }

    const target = applications.find((a) => a._id === appId);
    if (target) {
      setRoleTitle(`${target.company} · ${target.role}`);
      const appReqs = target.requirements && target.requirements.length > 0
        ? target.requirements
        : [];

      setRequirements(appReqs);
      setManualSkillsInput(appReqs.join(', '));

      if (appReqs.length > 0) {
        runAnalysis(target.role, appReqs, appId);
      } else {
        // Explicitly clear result to prevent misleading calculations
        setAnalysisResult(null);
      }
    }
  };

  // Add skill to user profile
  const handleAddSkillToProfile = async (skillName: string) => {
    setAddingSkill(skillName);
    try {
      await api.patch('/users/skills', { skill: skillName });
      await runAnalysis(
        roleTitle,
        requirements,
        evalMode === 'application' ? selectedAppId : undefined
      );
      setFeedbackMessage(`${skillName} added to your profile`);
    } catch (err: any) {
      setFeedbackMessage(err.response?.data?.message || `Failed to add ${skillName}.`);
    } finally {
      setAddingSkill(null);
    }
  };

  const handleApplyManualRequirements = () => {
    const parsed = manualSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setRequirements(parsed);
    runAnalysis(roleTitle, parsed, evalMode === 'application' ? selectedAppId : undefined);
    setShowManualEditor(false);
  };

  const handleExportReport = () => {
    if (!analysisResult) return;

    const content = [
      `මඟ (MAGA) — CAREER DIRECTION ANALYSIS`,
      `Role: ${roleTitle}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Alignment Score: ${analysisResult.matchScore}% (${analysisResult.matchedRequirements} requirements matched)`,
      `------------------------------------------------------------------`,
      `STRONG ALIGNMENT (SKILLS IN YOUR PROFILE):`,
      analysisResult.matchedSkills.length > 0
        ? analysisResult.matchedSkills.map((s) => `  ✓ ${s}`).join('\n')
        : '  None',
      `\nSKILLS TO DEVELOP:`,
      analysisResult.missingSkills.length > 0
        ? analysisResult.missingSkills.map((s) => `  ○ ${s}`).join('\n')
        : '  None — requirements fully satisfied',
      `\nYOUR NEXT STEPS:`,
      analysisResult.actionPlan.map((step, idx) => `  ${idx + 1}. ${step.title}\n     ${step.action}`).join('\n\n'),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maga-career-analysis-${roleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
            Career Analysis
          </h1>
          <p className="mt-0.5 text-sm text-textSecondary">
            Discover how your profile aligns with your target direction and what to do next.
          </p>
        </div>

        {analysisResult && (
          <button
            onClick={handleExportReport}
            className="rounded-btn border border-border bg-surface px-3 py-1.5 text-xs font-medium text-textSecondary hover:text-textPrimary hover:bg-background transition-colors self-start sm:self-auto"
          >
            Export Direction Plan (.txt)
          </button>
        )}
      </div>

      {/* Target Direction Selector Card */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
              Your Career Direction
            </span>
            <p className="text-xs text-textMuted mt-0.5">
              Analyze against a standard industry track or an application in your tracker.
            </p>
          </div>

          <div className="flex rounded-btn border border-border bg-background p-0.5 text-xs self-start sm:self-auto">
            <button
              onClick={() => {
                setEvalMode('track');
                handleSelectTrack(selectedTrack);
              }}
              className={`px-3 py-1 rounded-btn font-medium transition-colors ${
                evalMode === 'track'
                  ? 'bg-surface text-textPrimary font-semibold shadow-xs'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Standard Track
            </button>
            <button
              onClick={() => {
                setEvalMode('application');
                if (applications.length > 0) handleSelectApp(applications[0]._id);
              }}
              className={`px-3 py-1 rounded-btn font-medium transition-colors ${
                evalMode === 'application'
                  ? 'bg-surface text-textPrimary font-semibold shadow-xs'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Tracked Application
            </button>
          </div>
        </div>

        {/* Clean, calm dropdown selection */}
        {evalMode === 'track' ? (
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1.5">
              Target Career Direction
            </label>
            <select
              value={selectedTrack}
              onChange={(e) => handleSelectTrack(e.target.value)}
              className="w-full sm:w-80 rounded-input border border-border bg-background px-3 py-2 text-xs text-textPrimary focus:border-accent focus:outline-none"
            >
              {Object.keys(CAREER_TRACKS).map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1.5">
              Select Tracked Application
            </label>
            {applications.length > 0 ? (
              <select
                value={selectedAppId}
                onChange={(e) => handleSelectApp(e.target.value)}
                className="w-full sm:w-80 rounded-input border border-border bg-background px-3 py-2 text-xs text-textPrimary focus:border-accent focus:outline-none"
              >
                {applications.map((app) => (
                  <option key={app._id} value={app._id}>
                    {app.company} · {app.role} {app.matchScore !== undefined ? `(${app.matchScore}%)` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-textMuted italic">
                No tracked applications found. Use the Applications tab to add jobs to your tracker.
              </p>
            )}
          </div>
        )}

        {/* Requirements Summary & Inline Customizer */}
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-textMuted">Benchmark requirements:</span>
            {requirements.length > 0 ? (
              requirements.slice(0, 6).map((req) => (
                <span key={req} className="rounded bg-background border border-border px-2 py-0.5 text-textSecondary">
                  {req}
                </span>
              ))
            ) : (
              <span className="text-amber-700 italic">No requirements specified for this job.</span>
            )}
            {requirements.length > 6 && (
              <span className="text-textMuted">+{requirements.length - 6} more</span>
            )}
          </div>

          <button
            onClick={() => setShowManualEditor(!showManualEditor)}
            className="text-accent hover:underline font-medium self-start sm:self-auto shrink-0"
          >
            {showManualEditor ? 'Hide skills editor' : 'Customize requirements →'}
          </button>
        </div>

        {showManualEditor && (
          <div className="pt-3 border-t border-border space-y-2">
            <label className="block text-xs font-medium text-textSecondary">
              Edit technical skills list (comma-separated):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualSkillsInput}
                onChange={(e) => setManualSkillsInput(e.target.value)}
                className="flex-1 rounded-input border border-border bg-background px-3 py-1.5 text-xs text-textPrimary focus:border-accent focus:outline-none"
                placeholder="e.g. React, Node.js, Express, MongoDB"
              />
              <button
                onClick={handleApplyManualRequirements}
                className="rounded-btn bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {feedbackMessage && (
          <div className="text-xs text-accent font-medium pt-1">{feedbackMessage}</div>
        )}
      </div>

      {/* Analysis Presentation */}
      {analyzing ? (
        <div className="py-16 text-center border border-border rounded-card bg-surface">
          <p className="text-sm text-textSecondary">Analyzing profile alignment...</p>
          <p className="text-xs text-textMuted mt-1">Comparing profile skills against requirements</p>
        </div>
      ) : evalMode === 'application' && requirements.length === 0 ? (
        /* Explicit Empty State when an application has no saved requirements */
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center space-y-3">
          <span className="text-sm font-semibold text-textPrimary">Requirements Unavailable</span>
          <p className="text-xs text-textMuted max-w-md mx-auto">
            This tracked application does not currently have requirements saved to evaluate your profile alignment.
          </p>
          <button
            onClick={() => setShowManualEditor(true)}
            className="rounded-btn border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-textPrimary hover:bg-surface transition-colors"
          >
            Add Requirements to Analyze
          </button>
        </div>
      ) : analysisResult ? (
        <div className="space-y-6">
          {/* Hero Profile Alignment Metric */}
          <div className="rounded-card border border-border bg-surface p-8 text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-textMuted">
              Current Profile Alignment
            </span>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-5xl font-bold tracking-tight text-textPrimary">
                {analysisResult.matchScore}%
              </span>
            </div>
            <p className="text-xs font-medium text-textSecondary">
              {analysisResult.matchedRequirements} core requirements matched
            </p>

            <div className="max-w-md mx-auto w-full bg-border rounded-full h-2 mt-4">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  analysisResult.matchScore >= 75
                    ? 'bg-emerald-600'
                    : analysisResult.matchScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${analysisResult.matchScore}%` }}
              />
            </div>
          </div>

          {/* Alignment Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strong Alignment */}
            <div className="rounded-card border border-border bg-surface p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Strong Alignment
                </span>
                <span className="text-[11px] text-textMuted">Skills in your profile</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysisResult.matchedSkills.length > 0 ? (
                  analysisResult.matchedSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-textMuted italic">No skills matched yet.</span>
                )}
              </div>
            </div>

            {/* Skills to Develop */}
            <div className="rounded-card border border-border bg-surface p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Skills to Develop
                </span>
                <span className="text-[11px] text-textMuted">Opportunities to strengthen</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {analysisResult.missingSkills.length > 0 ? (
                  analysisResult.missingSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded bg-surface border border-border pl-2.5 pr-1 py-1 text-xs font-medium text-textPrimary"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleAddSkillToProfile(s)}
                        disabled={addingSkill === s}
                        className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                        title="Add this skill to your profile"
                      >
                        {addingSkill === s ? '...' : '+ Add'}
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-600 font-medium">
                    All core requirements covered!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actionable Next Steps */}
          <div className="rounded-card border border-border bg-surface p-6 space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
                Your Next Steps
              </span>
              <p className="text-xs text-textMuted mt-0.5">
                Concrete actions you can take to bridge your target direction&apos;s technical gaps.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {analysisResult.actionPlan.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-card bg-background/50 border border-border/70"
                >
                  <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-1 rounded shrink-0">
                    0{idx + 1}
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-textPrimary">
                      {step.title}
                    </h4>
                    <p className="text-xs text-textSecondary leading-relaxed">
                      {step.action}
                    </p>
                    {step.tags && step.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1.5">
                        {step.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-textMuted"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};