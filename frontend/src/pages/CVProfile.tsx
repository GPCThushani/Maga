import { useState, useEffect, type ChangeEvent } from 'react';
import { api } from '../services/api';

interface ATSFeedback {
  score: number;
  extractedSkills: string[];
  strengths: string[];
  improvements: string[];
}

const GRAD_YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export const CVProfile = () => {
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [gradYear, setGradYear] = useState('2026');
  const [targetRole, setTargetRole] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ATS Review State
  const [atsFeedback, setAtsFeedback] = useState<ATSFeedback | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        if (res.data?.user) {
          const u = res.data.user;
          setName(u.name || '');
          setUniversity(u.university || '');
          setDegree(u.degree || '');
          setGradYear(u.gradYear ? String(u.gradYear) : '2026');
          setTargetRole(u.targetRole || '');
          setSkills(Array.isArray(u.skills) ? u.skills : []);
          setCvFileName(u.cvUrl || '');
        }
      } catch (err: any) {
        console.error('Failed to load user profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setCvFile(selected);
      setCvFileName(selected.name);
      setUploadStatus('');
    }
  };

  // Upload and analyze a newly chosen file
  const handleUploadAndAnalyzeCV = async () => {
    if (!cvFile) return;

    setIsUploading(true);
    setUploadStatus('Extracting text and analyzing against ATS standards...');

    const formData = new FormData();
    formData.append('cv', cvFile);

    try {
      const res = await api.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCvFileName(res.data.fileName || cvFile.name);
      setCvFile(null);
      setUploadStatus('Resume analyzed and stored successfully.');

      if (res.data.feedback) {
        setAtsFeedback(res.data.feedback);
      }

      if (Array.isArray(res.data?.feedback?.extractedSkills)) {
        setSkills((prev) => Array.from(new Set([...prev, ...res.data.feedback.extractedSkills])));
      }
    } catch (err: any) {
      console.error('ATS upload failed:', err);
      setUploadStatus(err.response?.data?.message || 'Failed to analyze PDF document.');
    } finally {
      setIsUploading(false);
    }
  };

  // Analyze the resume currently linked to the user account
  const handleAnalyzeExistingCV = async () => {
    setIsUploading(true);
    setUploadStatus('Running ATS scan on active resume...');

    try {
      const res = await api.get('/cv/analyze');
      if (res.data?.feedback) {
        setAtsFeedback(res.data.feedback);
      }
      setUploadStatus('Analysis complete.');
    } catch (err: any) {
      console.error('Scan failed:', err);
      setUploadStatus(err.response?.data?.message || 'Could not analyze existing resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setUploadStatus('');

    try {
      await api.put('/users/profile', {
        name: name.trim(),
        university: university.trim(),
        degree: degree.trim(),
        gradYear: Number(gradYear),
        targetRole: targetRole.trim(),
        skills,
      });
      setUploadStatus('Profile details saved to database.');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setUploadStatus(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-textMuted">
        Loading user profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">CV & Profile</h1>
        <p className="mt-1 text-sm text-textSecondary">
          Manage your career profile, technical skill inventory, and ATS resume verification.
        </p>
      </div>

      {/* Resume Document & ATS Evaluation */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Resume Document & ATS Evaluation
          </h2>
          {cvFileName && !cvFile && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Active CV Stored
            </span>
          )}
        </div>

        <div className="border border-dashed border-border rounded-card p-6 text-center bg-background/50">
          {cvFileName ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-btn bg-surface border border-border shadow-xs">
                <span className="text-sm">📄</span>
                <span className="text-sm font-semibold text-textPrimary">{cvFileName}</span>
              </div>
              <p className="text-xs text-textMuted">
                {cvFile
                  ? 'New file selected but not yet uploaded'
                  : 'Verified document linked to your profile (PDF format)'}
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  id="cv-upload-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="cv-upload-input"
                  className="cursor-pointer rounded-btn border border-border bg-surface px-3 py-1.5 text-xs font-medium text-textSecondary hover:text-textPrimary hover:bg-background transition-colors"
                >
                  Replace PDF
                </label>

                {cvFile ? (
                  <button
                    type="button"
                    onClick={handleUploadAndAnalyzeCV}
                    disabled={isUploading}
                    className="rounded-btn bg-accent px-3.5 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? 'Analyzing...' : 'Upload & Re-scan'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAnalyzeExistingCV}
                    disabled={isUploading}
                    className="rounded-btn bg-accent px-3.5 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? 'Scanning...' : 'Re-run ATS Scan'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium text-textPrimary">No resume uploaded yet</div>
              <p className="text-xs text-textMuted mt-1">Upload standard PDF format up to 5MB</p>

              <div className="mt-4 flex items-center justify-center gap-3">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  id="cv-upload-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="cv-upload-input"
                  className="cursor-pointer rounded-btn border border-border bg-surface px-3 py-1.5 text-xs font-medium text-textPrimary hover:bg-background transition-colors"
                >
                  Choose PDF
                </label>

                {cvFile && (
                  <button
                    type="button"
                    onClick={handleUploadAndAnalyzeCV}
                    disabled={isUploading}
                    className="rounded-btn bg-accent px-3.5 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? 'Analyzing...' : 'Upload & Analyze with ATS'}
                  </button>
                )}
              </div>
            </div>
          )}

          {uploadStatus && (
            <div className="mt-3 text-xs text-accent font-medium">{uploadStatus}</div>
          )}
        </div>
      </div>

      {/* ATS Results Panel */}
      {atsFeedback && (
        <div className="rounded-card border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-semibold text-textPrimary">ATS Resume Match Report</h2>
              <p className="text-xs text-textMuted">Automated scan results based on standard parsing benchmarks</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-textSecondary font-medium">ATS Score:</span>
              <span
                className={`text-base font-bold px-2.5 py-0.5 rounded ${
                  atsFeedback.score >= 75
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {atsFeedback.score} / 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <span className="font-semibold text-emerald-700 block">✓ ATS Strengths</span>
              {atsFeedback.strengths.length > 0 ? (
                <ul className="space-y-1 text-textSecondary list-disc list-inside">
                  {atsFeedback.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-textMuted italic">No major strengths found.</span>
              )}
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-amber-700 block">⚠ Recommended Improvements</span>
              {atsFeedback.improvements.length > 0 ? (
                <ul className="space-y-1 text-textSecondary list-disc list-inside">
                  {atsFeedback.improvements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-emerald-600 font-medium">All standard ATS checks passed!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personal & Academic Profile */}
      <div className="rounded-card border border-border bg-surface p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
          Personal & Academic Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Target Internship Role</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer Intern, QA Trainee"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">University / Institute</label>
            <input
              type="text"
              placeholder="e.g. Sabaragamuwa University of Sri Lanka"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-textSecondary mb-1">Degree Program</label>
              <input
                type="text"
                placeholder="e.g. BSc (Hons) in Computing"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Graduate Year</label>
              <select
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
              >
                {GRAD_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Skill Tag Inventory */}
        <div className="pt-4 border-t border-border space-y-3">
          <label className="block text-xs font-medium text-textSecondary">Verified Technical Skills</label>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded bg-background border border-border px-2.5 py-1 text-xs text-textPrimary font-medium"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-textMuted hover:text-danger ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
            {skills.length === 0 && (
              <span className="text-xs text-textMuted italic">No technical skills added yet.</span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. React, Docker, Selenium)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              className="w-64 rounded-input border border-border bg-surface px-3 py-1.5 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="rounded-btn border border-border bg-background px-3 py-1.5 text-xs font-medium text-textPrimary hover:bg-surface transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="rounded-btn bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};