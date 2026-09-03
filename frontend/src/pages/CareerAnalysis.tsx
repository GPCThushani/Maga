import { useState } from 'react';
import { api } from '../services/api';

export const CareerAnalysis = () => {
  const [role, setRole] = useState('Full Stack Developer Intern');
  const [skillsInput, setSkillsInput] = useState('React, Node.js, Express, MongoDB, Docker, AWS, Git, TypeScript');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState({
    matchScore: 78,
    matchedRequirements: '6/8',
    matchedSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'Git', 'TypeScript'],
    missingSkills: ['Docker', 'AWS'],
    recommendations: [
      'Containerization is key for this role: containerize your existing MERN projects with Docker to bridge this requirement.',
      'AWS cloud fundamentals (EC2, S3) are requested. Add basic deployment architecture experience to your CV.',
    ],
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const skillsArray = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.post('/analysis/match', {
        jobRole: role,
        requiredSkills: skillsArray,
      });
      if (res.data) {
        setAnalysisResult(res.data);
      }
    } catch (err) {
      console.error('Analysis request error', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">Career Analysis</h1>
        <p className="mt-1 text-sm text-textSecondary">
          Compare your current CV profile against market requirements using deterministic evaluation.
        </p>
      </div>

      {/* Target Role & Skill Requirements Input */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
          Benchmark Target Evaluation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Target Internship Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Required Skills (Comma separated)</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="rounded-btn bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {analyzing ? 'Evaluating Profile...' : 'Run Match Analysis'}
        </button>
      </div>

      {/* Score and Gap Analysis Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="rounded-card border border-border bg-surface p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Overall Fit Score
          </span>
          <div className="my-6">
            <div className="text-4xl font-semibold text-textPrimary">{analysisResult.matchScore}%</div>
            <div className="mt-1 text-xs text-textSecondary">
              {analysisResult.matchedRequirements} requirements verified
            </div>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all"
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
              {analysisResult.matchedSkills.map((s) => (
                <span key={s} className="rounded bg-success-light text-success px-2 py-1 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <span className="text-xs font-medium text-danger flex items-center gap-1.5 mb-2">
              <span>! Missing or Unverified Skills</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysisResult.missingSkills.map((s) => (
                <span key={s} className="rounded bg-danger-light text-danger px-2 py-1 text-xs font-medium">
                  {s}
                </span>
              ))}
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