import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface TrackedApplication {
  _id: string;
  company: string;
  role: string;
  requirements?: string[];
  matchScore?: number;
}

interface AnalysisResult {
  matchScore: number;
  matchedRequirements: string;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

export const CareerAnalysis = () => {
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [role, setRole] = useState('Full Stack Developer Intern');
  const [skillsInput, setSkillsInput] = useState('React, Node.js, Express, MongoDB, Docker, AWS, Git, TypeScript');
  const [analyzing, setAnalyzing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({
    matchScore: 78,
    matchedRequirements: '6/8',
    matchedSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'Git', 'TypeScript'],
    missingSkills: ['Docker', 'AWS'],
    recommendations: [
      'Containerization is key for this role: containerize your existing MERN projects with Docker to bridge this requirement.',
      'AWS cloud fundamentals (EC2, S3) are requested. Add basic deployment architecture experience to your CV.',
    ],
  });

  // Load user's saved applications into the selector dropdown
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/applications');
        if (res.data?.applications) {
          setApplications(res.data.applications);
        }
      } catch (err) {
        console.error('Could not load tracked applications', err);
      }
    };
    fetchApplications();
  }, []);

  // When user picks an application from the dropdown, autofill the form
  const handleSelectApplication = (appId: string) => {
    setSelectedAppId(appId);
    setFeedbackMessage('');

    if (!appId) return;

    const target = applications.find((a) => a._id === appId);
    if (target) {
      setRole(target.role);
      if (target.requirements && target.requirements.length > 0) {
        setSkillsInput(target.requirements.join(', '));
      } else {
        setSkillsInput('');
      }
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setFeedbackMessage('');
    try {
      const skillsArray = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: {
        jobRole: string;
        requiredSkills: string[];
        applicationId?: string;
      } = {
        jobRole: role,
        requiredSkills: skillsArray,
      };

      if (selectedAppId) {
        payload.applicationId = selectedAppId;
      }

      const res = await api.post('/analysis/match', payload);
      if (res.data) {
        setAnalysisResult(res.data);
        if (selectedAppId) {
          setFeedbackMessage(
            `Fit match updated to ${res.data.matchScore}% and saved to this application.`
          );
          // Update local state copy of applications
          setApplications((prev) =>
            prev.map((app) =>
              app._id === selectedAppId
                ? { ...app, matchScore: res.data.matchScore }
                : app
            )
          );
        }
      }
    } catch (err: any) {
      setFeedbackMessage(
        err.response?.data?.message || 'Failed to run match evaluation. Please check your CV.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
          Career Analysis
        </h1>
        <p className="mt-1 text-sm text-textSecondary">
          Evaluate your parsed CV against specific industry requirements using factual skill verification.
        </p>
      </div>

      {/* Target Role & Skill Requirements Input Card */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Benchmark Target Evaluation
          </h2>

          {/* Quick-Select Tracked Job Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-textSecondary">Select from tracker:</span>
            <select
              value={selectedAppId}
              onChange={(e) => handleSelectApplication(e.target.value)}
              className="rounded-input border border-border bg-background px-2.5 py-1 text-xs text-textPrimary focus:border-accent focus:outline-none"
            >
              <option value="">-- Custom Evaluation --</option>
              {applications.map((app) => (
                <option key={app._id} value={app._id}>
                  {app.company} · {app.role} {app.matchScore ? `(${app.matchScore}%)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">
              Target Role Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accent"
              placeholder="e.g. Associate Software Engineer Intern"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">
              Required Technical Skills (Comma-separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accent"
              placeholder="e.g. React, Node.js, Docker, AWS"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded-btn bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {analyzing ? 'Evaluating CV Text...' : 'Run Match Analysis'}
          </button>

          {feedbackMessage && (
            <span className="text-xs text-accent font-medium">{feedbackMessage}</span>
          )}
        </div>
      </div>

      {/* Score and Gap Analysis Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="rounded-card border border-border bg-surface p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Overall Fit Score
          </span>
          <div className="my-6">
            <div className="text-4xl font-semibold text-textPrimary">
              {analysisResult.matchScore}%
            </div>
            <div className="mt-1 text-xs text-textSecondary">
              {analysisResult.matchedRequirements} requirements verified
            </div>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisResult.matchScore}%` }}
            />
          </div>
        </div>

        {/* Matched vs Missing Skills */}
        <div className="md:col-span-2 rounded-card border border-border bg-surface p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Requirements Breakdown
          </h2>

          <div>
            <span className="text-xs font-medium text-success flex items-center gap-1.5 mb-2">
              <span>✓ Verified Skills</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysisResult.matchedSkills.length > 0 ? (
                analysisResult.matchedSkills.map((s) => (
                  <span
                    key={s}
                    className="rounded bg-success-light text-success px-2 py-1 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-textMuted">No skills verified yet.</span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <span className="text-xs font-medium text-danger flex items-center gap-1.5 mb-2">
              <span>! Missing or Unverified Skills</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysisResult.missingSkills.length > 0 ? (
                analysisResult.missingSkills.map((s) => (
                  <span
                    key={s}
                    className="rounded bg-danger-light text-danger px-2 py-1 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-textMuted">No skill gaps identified.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
          Targeted Advice to Improve Fit
        </h2>
        <div className="space-y-2 text-sm text-textPrimary">
          {analysisResult.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-2 items-start py-1">
              <span className="text-accent font-semibold">·</span>
              <p className="leading-relaxed text-textSecondary">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};